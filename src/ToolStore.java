

public class ToolStore extends NormalLoc{

    ToolStore(Player player) {
        super(player, "Store");
    }

    public boolean getLocation(){
        System.out.println("Money :  "  +player.getMoney());
        System.out.println("1. Guns");
        System.out.println("2. Archers");
        System.out.println("3. Exit");
        System.out.println("your choice : ");
        int selTool= scan.nextInt();
        int selItemID;

        switch (selTool){
            case 1:
                selItemID =  weaponMenu();
                buyWeapoen(selItemID);
                break;
            case 2:
                break;
            default :
                break;
        }
        return true;
    }


    public int weaponMenu(){
        System.out.println("1. tabanca\t <Money : 25 - Damage : 2>");
        System.out.println("2. Kilic\t <Money : 35 - Damage : 3>");
        System.out.println("3. Tufek\t <Money : 45 - Damage : 7>");
        System.out.println("4. Exit");
        System.out.println("Select a  gun : ");

        int selWeaponID= scan.nextInt();
        return selWeaponID;
    }


    public void buyWeapoen(int itemID){
        int damage=0, price=0;
        String wName=null;

        switch (itemID){
            case 1:
                damage=2;
                wName="Tabanca";
                price=5;
                break;

            case 2:
                damage=3;
                wName="Kilic";
                price=35;
                break;

            case 3:
                damage=7;
                wName="Tufek";
                price=45;
                break;
            default:
            System.out.println("invalid processs...");
            break;
        }

        if(player.getMoney() > price) {
            player.getInv().setDamage(damage);
            player.getInv().setwName(wName);
            player.setMoney(player.getMoney() - price);
            System.out.println(wName + " you bought the Guns , the previous damage : " +player.getDamage() +
                    "the new damage  " + (player.getDamage() +player.getInv().getDamage()) );

            System.out.println("the rest of the money : " + player.getMoney());
        }else {
            System.out.println("Your money is not enough to go !!");
        }


    }
}
