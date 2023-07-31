public abstract  class BattleLoc extends Location{
    protected  Obstacle obstacle;
    protected String award;
    BattleLoc(Player player, String name, Obstacle obstacle, String award) {
        super(player);
        this.obstacle=obstacle;
        this.name=name;
        this.award=award;
    }

    public boolean getLocation(){
        int obsCount = obstacle.count();
        System.out.println("Now, rigtht here  " + this.getName() + " ");
        System.out.println("Be careful, there are  here  " + obsCount + " times " + obstacle.getName() );
        System.out.print("<S>avas or <K>ac : ");
        String selCase= scan.nextLine();
        selCase= selCase.toUpperCase();
        if (selCase.equals("S")){
            if(combat(obsCount)){
                System.out.println(this.getName()  + " in the are, you beat all the enemies !!");
                if(this.award.equals("Food") && player.getInv().isFood()== false){
                    System.out.println(this.award + " you won!!  ");
                    player.getInv().setFood(true);
                } else  if(this.award.equals("Water") && player.getInv().isWater()== false){
                    System.out.println(this.award + " you won!!  ");
                    player.getInv().setWater(true);
                }else  if(this.award.equals("Firewood") && player.getInv().isFirewood()== false){
                    System.out.println(this.award + " you won!!  ");
                    player.getInv().setFirewood(true);
                }
                return true;
            }else {

            }
            if(player.getHealthy()<= 0){
                    System.out.println("you are died !!");
                    return false;

            }

        }

        return true;
    }

    public boolean combat(int obsCount){
        for(int i=0; i<obsCount; i++){
            int defObsHealth = obstacle.getHealth();
            playerStats();
            enemyStats();
            while(player.getHealthy() > 0 && obstacle.getHealth() > 0){
                System.out.print("<V>ur or <Kac> : ");
                String selCase= scan.nextLine();
                selCase= selCase.toUpperCase();
                if(selCase.equals("V")){
                    System.out.println("You hit !");
                    obstacle.setHealth(obstacle.getHealth()- player.getTotalDamage());
                    afterHit();
                    if(obstacle.getHealth() > 0){
                        System.out.println();
                        System.out.println("Enemy hit you ! " );
                        player.setrHealthy(player.getHealthy() - (obstacle.getDamage()- player.getInv().getArmor()));
                        afterHit();
                    }

                }else{
                    return false;
                }
            }

            if(obstacle.getHealth() < player.getHealthy()  ){
                System.out.println("You beat the enemy ! ");
                player.setMoney(player.getMoney() + obstacle.getAward());
                System.out.println("New amount of money : " +player.getMoney());
                obstacle.setHealth(defObsHealth);

            }else{
                return false;
            }
            System.out.println("--------------------------------");
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

    public void afterHit(){
        System.out.println("Player health : " + player.getHealthy());
        System.out.println(obstacle.getName() + " health : " + obstacle.getHealth() );
        System.out.println();
    }

}
