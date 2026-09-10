import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Serves the web UI (web/) and a tiny JSON API backed by per-session WebGame instances.
 * Run from the repository root: java -cp out GameServer [port]
 */
public class GameServer {

    private static final Map<String, WebGame> sessions = new ConcurrentHashMap<>();
    private static Path webRoot;

    public static void main(String[] args) throws IOException {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 8080;
        webRoot = Paths.get("web");
        if (!Files.isDirectory(webRoot)) {
            System.err.println("Could not find the 'web' directory. Run this from the repository root.");
            System.exit(1);
        }

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/api/new", GameServer::handleNew);
        server.createContext("/api/action", GameServer::handleAction);
        server.createContext("/", GameServer::handleStatic);
        server.setExecutor(null);
        server.start();
        System.out.println("Adventure Game server running at http://localhost:" + port);
    }

    private static void handleStatic(HttpExchange ex) throws IOException {
        String path = ex.getRequestURI().getPath();
        if (path.equals("/")) path = "/index.html";
        Path file = webRoot.resolve(path.substring(1)).normalize();
        if (!file.startsWith(webRoot) || !Files.isRegularFile(file)) {
            respond(ex, 404, "text/plain", "Not found");
            return;
        }
        byte[] data = Files.readAllBytes(file);
        ex.getResponseHeaders().set("Content-Type", contentTypeFor(file.toString()));
        ex.sendResponseHeaders(200, data.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(data);
        }
    }

    private static String contentTypeFor(String name) {
        if (name.endsWith(".html")) return "text/html; charset=utf-8";
        if (name.endsWith(".css")) return "text/css; charset=utf-8";
        if (name.endsWith(".js")) return "application/javascript; charset=utf-8";
        return "application/octet-stream";
    }

    private static void handleNew(HttpExchange ex) throws IOException {
        String id = UUID.randomUUID().toString();
        WebGame game = new WebGame();
        sessions.put(id, game);
        respondJson(ex, 200, game.begin().toJson(id));
    }

    private static void handleAction(HttpExchange ex) throws IOException {
        if (!"POST".equals(ex.getRequestMethod())) {
            respond(ex, 405, "text/plain", "Method not allowed");
            return;
        }
        Map<String, String> params = parseForm(readBody(ex));
        String sessionId = params.get("sessionId");
        WebGame game = sessionId != null ? sessions.get(sessionId) : null;
        if (game == null) {
            respond(ex, 400, "text/plain", "Unknown session");
            return;
        }

        String type = params.getOrDefault("type", "");
        String value = params.getOrDefault("value", "");
        GameView view;
        switch (type) {
            case "name": view = game.submitName(value); break;
            case "character": view = game.selectCharacter(parseIntSafe(value)); break;
            case "location": view = game.selectLocation(parseIntSafe(value)); break;
            case "battleDecision": view = game.battleDecision(value); break;
            case "combat": view = game.combatAction(value); break;
            case "store": view = game.storeChoice(value); break;
            case "buyWeapon": view = game.buyWeapon(parseIntSafe(value)); break;
            case "buyArmor": view = game.buyArmor(parseIntSafe(value)); break;
            case "restart": view = game.restart(); break;
            default:
                respond(ex, 400, "text/plain", "Unknown action");
                return;
        }
        respondJson(ex, 200, view.toJson(sessionId));
    }

    private static String readBody(HttpExchange ex) throws IOException {
        try (InputStream is = ex.getRequestBody(); ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            byte[] buf = new byte[1024];
            int n;
            while ((n = is.read(buf)) != -1) bos.write(buf, 0, n);
            return bos.toString(StandardCharsets.UTF_8.name());
        }
    }

    private static Map<String, String> parseForm(String body) {
        Map<String, String> map = new HashMap<>();
        if (body == null || body.isEmpty()) return map;
        for (String pair : body.split("&")) {
            int eq = pair.indexOf('=');
            if (eq < 0) continue;
            try {
                String k = URLDecoder.decode(pair.substring(0, eq), "UTF-8");
                String v = URLDecoder.decode(pair.substring(eq + 1), "UTF-8");
                map.put(k, v);
            } catch (UnsupportedEncodingException ignored) {
            }
        }
        return map;
    }

    private static int parseIntSafe(String s) {
        try {
            return Integer.parseInt(s.trim());
        } catch (Exception e) {
            return -1;
        }
    }

    private static void respond(HttpExchange ex, int code, String contentType, String body) throws IOException {
        byte[] data = body.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", contentType + "; charset=utf-8");
        ex.sendResponseHeaders(code, data.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(data);
        }
    }

    private static void respondJson(HttpExchange ex, int code, String json) throws IOException {
        respond(ex, code, "application/json", json);
    }
}
