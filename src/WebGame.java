import java.util.ArrayList;
import java.util.List;

/**
 * Non-blocking, per-session port of the console game's flow (Game/BattleLoc/ToolStore)
 * so it can be driven step by step over HTTP instead of blocking on System.in.
 * Reuses the untouched domain classes (Player, Inventory, Obstacle, Vampire, Zombie, Bear).
 */
public class WebGame {

    public enum State {
        NAME, CHARACTER, MAIN_MENU, BATTLE_DECISION, COMBAT,
        STORE_MENU, STORE_WEAPON, STORE_ARMOR, GAME_OVER
    }

    private State state = State.NAME;
    private Player player;
    private final List<String> log = new ArrayList<>();
    private final List<GameView.Event> events = new ArrayList<>();
    private boolean won = false;

    private Obstacle obstacle;
    private String battleAward;
    private String battleLocName;
    private int obsCount;
    private int enemyIndex;
    private int defObsHealth;

    public WebGame() {
        log.add("Welcome to the Adventure Game !");
    }

    public GameView begin() {
        return view("Before you, please type your name :");
    }

    public GameView restart() {
        state = State.NAME;
        player = null;
        won = false;
        obstacle = null;
        log.clear();
        events.clear();
        log.add("Welcome to the Adventure Game !");
        return begin();
    }

    public GameView submitName(String name) {
        if (state != State.NAME) return error("Not expecting a name right now.");
        if (name == null || name.trim().isEmpty()) return view("Before you, please type your name :");
        player = new Player(name.trim());
        state = State.CHARACTER;
        return view("Character selection is :");
    }

    public GameView selectCharacter(int id) {
        if (state != State.CHARACTER) return error("Not expecting a character choice right now.");
        switch (id) {
            case 1: player.initPlayer("Samurai", 5, 21, 15); break;
            case 2: player.initPlayer("Archer", 7, 18, 20); break;
            case 3: player.initPlayer("Cavailer", 8, 24, 5); break;
            default: player.initPlayer("Samurai", 5, 21, 15); break;
        }
        log.add("Character created : " + player.getcName() + "\tDamage: " + player.getDamage()
                + "\tHealthy:" + player.getHealthy() + "\tmoney:" + player.getMoney());
        state = State.MAIN_MENU;
        return view("The place you want go :");
    }

    public GameView selectLocation(int id) {
        if (state != State.MAIN_MENU) return error("Not expecting a location choice right now.");
        switch (id) {
            case 1:
                if (player.getInv().isFirewood() && player.getInv().isFood() && player.getInv().isWater()) {
                    log.add("Congrats , you won the game 1");
                    won = true;
                    state = State.GAME_OVER;
                    return view(null);
                }
                player.setHealthy(player.getrHealthy());
                log.add("you are get health...............");
                log.add("Now, you are in safe house...");
                return view("The place you want go :");
            case 2: return enterBattle("Cave", new Zombie(), "Food");
            case 3: return enterBattle("Forest", new Vampire(), "Firewood");
            case 4: return enterBattle("River", new Bear(), "Water");
            case 5:
                log.add("Money :  " + player.getMoney());
                state = State.STORE_MENU;
                return view("your choice :");
            default:
                return error("Please enter a valid place.");
        }
    }

    private GameView enterBattle(String name, Obstacle o, String award) {
        obstacle = o;
        battleAward = award;
        battleLocName = name;
        obsCount = obstacle.count();
        enemyIndex = 0;
        log.add("Now, rigtht here  " + name + " ");
        log.add("Be careful, there are  here  " + obsCount + " times " + obstacle.getName());
        state = State.BATTLE_DECISION;
        return view("<S>avas or <K>ac :");
    }

    public GameView battleDecision(String choice) {
        if (state != State.BATTLE_DECISION) return error("Not expecting a battle decision right now.");
        if ("fight".equalsIgnoreCase(choice)) {
            beginEnemy();
            return view("<V>ur or <Kac> :");
        }
        state = State.MAIN_MENU;
        return view("The place you want go :");
    }

    private void beginEnemy() {
        defObsHealth = obstacle.getHealth();
        log.add("Player stats");
        log.add("Health : " + player.getHealthy());
        log.add("Damage : " + player.getDamage());
        log.add("Money : " + player.getMoney());
        if (player.getInv().getDamage() > 0) log.add("Weapon : " + player.getInv().getwName());
        if (player.getInv().getArmor() > 0) log.add("Armor : " + player.getInv().getaName());
        log.add(obstacle.getName() + " stats");
        log.add("Health : " + obstacle.getHealth());
        log.add("Damage : " + obstacle.getDamage());
        log.add("Money : " + obstacle.getAward());
        state = State.COMBAT;
    }

    private void event(String type, String target, int amount) {
        events.add(new GameView.Event(type, target, amount));
    }

    private void afterHit() {
        log.add("Player health : " + player.getHealthy());
        log.add(obstacle.getName() + " health : " + obstacle.getHealth());
    }

    public GameView combatAction(String choice) {
        if (state != State.COMBAT) return error("Not expecting a combat action right now.");
        if (!"attack".equalsIgnoreCase(choice)) {
            event("flee", null, 0);
            state = State.MAIN_MENU;
            return view("The place you want go :");
        }

        log.add("You hit !");
        int playerDmg = player.getTotalDamage();
        obstacle.setHealth(obstacle.getHealth() - playerDmg);
        event("playerAttack", "enemy", playerDmg);
        afterHit();

        if (obstacle.getHealth() > 0) {
            log.add("Enemy hit you ! ");
            int enemyDmg = obstacle.getDamage() - player.getInv().getArmor();
            player.setrHealthy(player.getHealthy() - enemyDmg);
            event("enemyAttack", "player", enemyDmg);
            afterHit();
            return view("<V>ur or <Kac> :");
        }

        event("enemyDefeated", "enemy", 0);

        if (obstacle.getHealth() < player.getHealthy()) {
            log.add("You beat the enemy ! ");
            player.setMoney(player.getMoney() + obstacle.getAward());
            log.add("New amount of money : " + player.getMoney());
            obstacle.setHealth(defObsHealth);
            log.add("--------------------------------");
        } else {
            if (player.getHealthy() <= 0) {
                log.add("Oyun bitti !!");
                event("gameOver", null, 0);
                state = State.GAME_OVER;
                return view(null);
            }
            state = State.MAIN_MENU;
            return view("The place you want go :");
        }

        enemyIndex++;

        if (player.getHealthy() <= 0) {
            log.add("Oyun bitti !!");
            event("gameOver", null, 0);
            state = State.GAME_OVER;
            return view(null);
        }

        if (enemyIndex < obsCount) {
            beginEnemy();
            return view("<V>ur or <Kac> :");
        }

        log.add(battleLocName + " in the are, you beat all the enemies !!");
        if ("Food".equals(battleAward) && !player.getInv().isFood()) {
            log.add(battleAward + " you won!!  ");
            player.getInv().setFood(true);
        } else if ("Water".equals(battleAward) && !player.getInv().isWater()) {
            log.add(battleAward + " you won!!  ");
            player.getInv().setWater(true);
        } else if ("Firewood".equals(battleAward) && !player.getInv().isFirewood()) {
            log.add(battleAward + " you won!!  ");
            player.getInv().setFirewood(true);
        }
        event("victory", battleAward, 0);
        state = State.MAIN_MENU;
        return view("The place you want go :");
    }

    public GameView storeChoice(String choice) {
        if (state != State.STORE_MENU) return error("Not expecting a store choice right now.");
        if ("weapon".equals(choice)) {
            state = State.STORE_WEAPON;
            return view("Select a gun :");
        } else if ("armor".equals(choice)) {
            state = State.STORE_ARMOR;
            return view("Select an armor :");
        }
        log.add("program is cancelling...");
        state = State.MAIN_MENU;
        return view("The place you want go :");
    }

    public GameView buyWeapon(int id) {
        if (state != State.STORE_WEAPON) return error("Not expecting a purchase right now.");
        int damage = 0, price = 0;
        String wName = null;
        switch (id) {
            case 1: damage = 2; wName = "Tabanca"; price = 25; break;
            case 2: damage = 3; wName = "Kilic"; price = 35; break;
            case 3: damage = 7; wName = "Tufek"; price = 45; break;
            case 4: log.add("program is cancelling..."); break;
            default: log.add("invalid processs..."); break;
        }
        if (price > 0) {
            if (player.getMoney() > price) {
                player.getInv().setDamage(damage);
                player.getInv().setwName(wName);
                player.setMoney(player.getMoney() - price);
                log.add(wName + " you bought, the previous damage : " + player.getDamage()
                        + "the new damage  " + player.getTotalDamage());
                log.add("the rest of the money : " + player.getMoney());
            } else {
                log.add("Your money is not enough to go !!");
            }
        }
        state = State.MAIN_MENU;
        return view("The place you want go :");
    }

    public GameView buyArmor(int id) {
        if (state != State.STORE_ARMOR) return error("Not expecting a purchase right now.");
        int avoid = 0, price = 0;
        String aName = null;
        switch (id) {
            case 1: avoid = 1; aName = "Light Armor"; price = 15; break;
            case 2: avoid = 3; aName = "Middle Armor"; price = 25; break;
            case 3: avoid = 5; aName = "Heavy Armor"; price = 40; break;
            case 4: log.add("program is cancelling..."); break;
            default: log.add("invalid processs..."); break;
        }
        if (price > 0) {
            if (player.getMoney() >= price) {
                player.getInv().setArmor(avoid);
                player.getInv().setaName(aName);
                player.setMoney(player.getMoney() - price);
                log.add(aName + " you bought, blockaged damage : " + player.getInv().getArmor());
                log.add("the rest of the money : " + player.getMoney());
            } else {
                log.add("Your money is not enough to go !!");
            }
        }
        state = State.MAIN_MENU;
        return view("The place you want go :");
    }

    private GameView error(String msg) {
        log.add(msg);
        return view(null);
    }

    private GameView view(String prompt) {
        GameView v = new GameView();
        v.state = state.name();
        v.prompt = prompt;
        v.gameOver = state == State.GAME_OVER;
        v.won = won;
        v.log = new ArrayList<>(log);
        log.clear();
        v.events = new ArrayList<>(events);
        events.clear();
        v.inputType = state == State.NAME ? "text" : "buttons";
        v.options = buildOptions();
        v.player = player == null ? null : snapshotPlayer();
        v.enemy = (state == State.COMBAT && obstacle != null) ? snapshotEnemy() : null;
        return v;
    }

    private List<GameView.Option> buildOptions() {
        List<GameView.Option> opts = new ArrayList<>();
        switch (state) {
            case CHARACTER:
                opts.add(new GameView.Option("character", "1", "Samurai", "Damage 5 · Health 21 · Money 15"));
                opts.add(new GameView.Option("character", "2", "Archer", "Damage 7 · Health 18 · Money 20"));
                opts.add(new GameView.Option("character", "3", "Cavalier", "Damage 8 · Health 24 · Money 5"));
                break;
            case MAIN_MENU:
                opts.add(new GameView.Option("location", "1", "Safe House", "No enemy here — rest and recover"));
                opts.add(new GameView.Option("location", "2", "Cave", "You might see a ZOMBIE here"));
                opts.add(new GameView.Option("location", "3", "Forest", "You might see a Vampire here"));
                opts.add(new GameView.Option("location", "4", "Lake", "You might see a Bear here"));
                opts.add(new GameView.Option("location", "5", "Store", "Buy a gun or armor"));
                break;
            case BATTLE_DECISION:
                opts.add(new GameView.Option("battleDecision", "fight", "Fight", "Savas"));
                opts.add(new GameView.Option("battleDecision", "flee", "Flee", "Kac"));
                break;
            case COMBAT:
                opts.add(new GameView.Option("combat", "attack", "Attack", "Vur"));
                opts.add(new GameView.Option("combat", "flee", "Flee", "Kac"));
                break;
            case STORE_MENU:
                opts.add(new GameView.Option("store", "weapon", "Guns", null));
                opts.add(new GameView.Option("store", "armor", "Armor", null));
                opts.add(new GameView.Option("store", "exit", "Exit", null));
                break;
            case STORE_WEAPON:
                opts.add(new GameView.Option("buyWeapon", "1", "Tabanca", "Money 25 · Damage 2"));
                opts.add(new GameView.Option("buyWeapon", "2", "Kilic", "Money 35 · Damage 3"));
                opts.add(new GameView.Option("buyWeapon", "3", "Tufek", "Money 45 · Damage 7"));
                opts.add(new GameView.Option("buyWeapon", "4", "Exit", null));
                break;
            case STORE_ARMOR:
                opts.add(new GameView.Option("buyArmor", "1", "Light Armor", "Money 15 · Avoid 1"));
                opts.add(new GameView.Option("buyArmor", "2", "Middle Armor", "Money 25 · Avoid 3"));
                opts.add(new GameView.Option("buyArmor", "3", "Heavy Armor", "Money 40 · Avoid 5"));
                opts.add(new GameView.Option("buyArmor", "4", "Exit", null));
                break;
            case GAME_OVER:
                opts.add(new GameView.Option("restart", "", "Play Again", null));
                break;
            default:
                break;
        }
        return opts;
    }

    private GameView.PlayerSnapshot snapshotPlayer() {
        GameView.PlayerSnapshot p = new GameView.PlayerSnapshot();
        p.name = player.getName();
        p.cls = player.getcName();
        p.health = player.getHealthy();
        p.maxHealth = player.getrHealthy();
        p.damage = player.getDamage();
        p.totalDamage = player.getTotalDamage();
        p.money = player.getMoney();
        p.weapon = player.getInv().getwName();
        p.armor = player.getInv().getaName();
        p.food = player.getInv().isFood();
        p.water = player.getInv().isWater();
        p.firewood = player.getInv().isFirewood();
        return p;
    }

    private GameView.EnemySnapshot snapshotEnemy() {
        GameView.EnemySnapshot e = new GameView.EnemySnapshot();
        e.name = obstacle.getName();
        e.health = obstacle.getHealth();
        e.maxHealth = defObsHealth;
        e.damage = obstacle.getDamage();
        e.index = enemyIndex + 1;
        e.total = obsCount;
        return e;
    }
}
