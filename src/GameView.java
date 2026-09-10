import java.util.List;

public class GameView {

    String state;
    String prompt;
    String inputType;
    boolean gameOver;
    boolean won;
    List<String> log;
    List<Option> options;
    List<Event> events;
    PlayerSnapshot player;
    EnemySnapshot enemy;

    public static class Option {
        final String type, value, label, detail;

        Option(String type, String value, String label, String detail) {
            this.type = type;
            this.value = value;
            this.label = label;
            this.detail = detail;
        }
    }

    public static class PlayerSnapshot {
        String name, cls, weapon, armor;
        int health, maxHealth, damage, totalDamage, money;
        boolean food, water, firewood;
    }

    public static class EnemySnapshot {
        String name;
        int health, maxHealth, damage, index, total;
    }

    public static class Event {
        final String type, target;
        final int amount;

        public Event(String type, String target, int amount) {
            this.type = type;
            this.target = target;
            this.amount = amount;
        }
    }

    public String toJson(String sessionId) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"sessionId\":").append(Json.str(sessionId)).append(",");
        sb.append("\"state\":").append(Json.str(state)).append(",");
        sb.append("\"prompt\":").append(Json.str(prompt)).append(",");
        sb.append("\"inputType\":").append(Json.str(inputType)).append(",");
        sb.append("\"gameOver\":").append(gameOver).append(",");
        sb.append("\"won\":").append(won).append(",");

        sb.append("\"log\":[");
        for (int i = 0; i < log.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(Json.str(log.get(i)));
        }
        sb.append("],");

        sb.append("\"options\":[");
        for (int i = 0; i < options.size(); i++) {
            if (i > 0) sb.append(",");
            Option o = options.get(i);
            sb.append("{\"type\":").append(Json.str(o.type))
              .append(",\"value\":").append(Json.str(o.value))
              .append(",\"label\":").append(Json.str(o.label))
              .append(",\"detail\":").append(Json.str(o.detail))
              .append("}");
        }
        sb.append("],");

        sb.append("\"events\":[");
        for (int i = 0; i < events.size(); i++) {
            if (i > 0) sb.append(",");
            Event e = events.get(i);
            sb.append("{\"type\":").append(Json.str(e.type))
              .append(",\"target\":").append(Json.str(e.target))
              .append(",\"amount\":").append(e.amount)
              .append("}");
        }
        sb.append("],");

        sb.append("\"player\":");
        if (player == null) {
            sb.append("null");
        } else {
            sb.append("{")
              .append("\"name\":").append(Json.str(player.name)).append(",")
              .append("\"class\":").append(Json.str(player.cls)).append(",")
              .append("\"health\":").append(player.health).append(",")
              .append("\"maxHealth\":").append(player.maxHealth).append(",")
              .append("\"damage\":").append(player.damage).append(",")
              .append("\"totalDamage\":").append(player.totalDamage).append(",")
              .append("\"money\":").append(player.money).append(",")
              .append("\"weapon\":").append(Json.str(player.weapon)).append(",")
              .append("\"armor\":").append(Json.str(player.armor)).append(",")
              .append("\"food\":").append(player.food).append(",")
              .append("\"water\":").append(player.water).append(",")
              .append("\"firewood\":").append(player.firewood)
              .append("}");
        }
        sb.append(",");

        sb.append("\"enemy\":");
        if (enemy == null) {
            sb.append("null");
        } else {
            sb.append("{")
              .append("\"name\":").append(Json.str(enemy.name)).append(",")
              .append("\"health\":").append(enemy.health).append(",")
              .append("\"maxHealth\":").append(enemy.maxHealth).append(",")
              .append("\"damage\":").append(enemy.damage).append(",")
              .append("\"index\":").append(enemy.index).append(",")
              .append("\"total\":").append(enemy.total)
              .append("}");
        }

        sb.append("}");
        return sb.toString();
    }
}
