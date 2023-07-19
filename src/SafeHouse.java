public class SafeHouse extends NormalLoc{
    SafeHouse(Player player) {
        super(player, "Guvenli ev");
    }

    public boolean getLocation(){
        player.setHealthy(player.getrHealthy());
        System.out.println("you are get health...............");
        System.out.println("Now, you are in safe house...");
        return true;
    }
}
