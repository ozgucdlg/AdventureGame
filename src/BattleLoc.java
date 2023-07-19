public abstract  class BattleLoc extends Location{

    Obstacle obstacle;
    BattleLoc(Player player, String name, Obstacle obstacle) {
        super(player);
        this.obstacle=obstacle;
        this.name=name;
    }

    public boolean getLocation(){
        return true;
    }
}
