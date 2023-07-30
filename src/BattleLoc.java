public abstract  class BattleLoc extends Location{
    protected  Obstacle obstacle;
    BattleLoc(Player player, String name, Obstacle obstacle) {
        super(player);
        this.obstacle=obstacle;
        this.name=name;
    }

    public boolean getLocation(){
        int obsCount = obstacle.count();

        return true;
    }
}
