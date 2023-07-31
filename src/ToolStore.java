

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
                selItemID= armorMenu();
                buyArmor(selItemID);
                break;
            default :
                break;
        }
        return true;
    }

    public int armorMenu(){
        System.out.println("1. Light Armor\t <Money : 15 - avoid : 1>");
        System.out.println("2. Middle Armor\t <Money : 25 - avoid : 3>");
        System.out.println("3. Heavy Armor\t <Money : 40 - avoid : 5>");
        System.out.println("4. Exit");
        System.out.println("Select a  armor : ");

        int selArmorID= scan.nextInt();
        return selArmorID;

    }

    public void buyArmor(int itemID){

        int avoid=0, price=0;
        String aName=null;

        switch (itemID){
            case 1:
                avoid=1;
                aName="Light Armor";
                price=15;
                break;

            case 2:
                avoid=3;
                aName="Middle Armor";
                price=25;
                break;

            case 3:
                avoid=5;
                aName="Heavy Armor";
                price=40;
                break;

            case 4:
                System.out.println("program is cancelling...");
                break;

            default:
                System.out.println("invalid processs...");
                break;
        }

        if(price > 0 ) {

            if (player.getMoney() >= price) {

                player.getInv().setArmor(avoid);
                player.getInv().setaName(aName);
                player.setMoney(player.getMoney() - price);
                System.out.println(aName + " you bought, blockaged damage : " + player.getInv().getArmor());
                System.out.println("the rest of the money : " + player.getMoney());
            } else {
                System.out.println("Your money is not enough to go !!");
            }

        }

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
                price=25;
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

            case 4:
                System.out.println("program is cancelling...");
            break;

            default:
            System.out.println("invalid processs...");
            break;
        }

        if(price > 0 ) {

            if (player.getMoney() > price) {
                player.getInv().setDamage(damage);
                player.getInv().setwName(wName);
                player.setMoney(player.getMoney() - price);
                System.out.println(wName + " you bought, the previous damage : " + player.getDamage() +
                        "the new damage  " + player.getTotalDamage());

                System.out.println("the rest of the money : " + player.getMoney());
            } else {
                System.out.println("Your money is not enough to go !!");
            }

        }


    }
}
