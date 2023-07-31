public abstract  class BattleLoc extends Location{
    protected  Obstacle obstacle;
    BattleLoc(Player player, String name, Obstacle obstacle) {
        super(player);
        this.obstacle=obstacle;
        this.name=name;
    }

    public boolean getLocation(){
        int obsCount = obstacle.count();
        System.out.println("Now, rigtht here  " + this.getName() + " ");
        System.out.println("Be careful, there are  here  " + obsCount + " times " + obstacle.getName() );
        System.out.println("<S>avas or <K>ac");
        String selCase= scan.next();
        selCase= selCase.toUpperCase();
        if (selCase.equals("S")){
            if(combat(obsCount)){
                System.out.println(this.getName()  + " in the are, you beat all the enemies !!");
                return true;
            }else{
                System.out.println("you are died !!");
                return false;
            }
        }

        return true;
    }

    public boolean combat(int obsCount){
        for(int i=0; i<obsCount; i++){
            playerStats();
            enemyStats();
        }
        return true;
    }

    public void playerStats(){
        System.out.println("Player stats \n-----------------");
        System.out.println("Health : " +player.getHealthy());
        System.out.println("Damage : " + player.getDamage());
        System.out.println("Money : " + player.getMoney());
        if(player.getInv().getDamage() > 0){
            System.out.println("Weapon : " +player.getInv().getwName());
        }
        if(player.getInv().getArmor() > 0){
            System.out.println("Armor : " +player.getInv().getaName());
        }

    }

    public void enemyStats(){
        System.out.println("\n" + obstacle.getName() + " stats\n------------------- ");
        System.out.println("Health : " +obstacle.getHealth());
        System.out.println("Damage : " + obstacle.getDamage());
        System.out.println("Money : " + obstacle.getAward());

    }

}
