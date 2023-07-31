import java.util.Scanner;

public class Game {

    Player player;
    Location location;
    Scanner scan = new Scanner(System.in);

    public void login(){
        Scanner scan= new Scanner(System.in);
        System.out.println("Welcome to the Adventure Game !");
        System.out.print("Before you, please type your name : ");
        String playerName = scan.nextLine();

        player= new Player(playerName);  // player object assigned the new constror
        player.selectCha();
        start();
    }


    public void start(){
        while(true){
            System.out.println();
            System.out.println("===========================================");
            System.out.println();
            System.out.println("Please choose a place to take an action");
            System.out.println("1. Safe house -->   There is no enemy here");
            System.out.println("2. Cave       -->   You might see a ZOMBIE here");
            System.out.println("3. Forest     -->   You might see a Vampire here");
            System.out.println("4. Lake       -->   You might see  A bear");
            System.out.println("5. Store      -->   You can buy Gun or guard protection ");
            System.out.print("The place you want go : ");
            int selLoc= scan.nextInt();
            while(selLoc<0 ||selLoc>5){
                System.out.print("Please enter valid place : ");
                selLoc= scan.nextInt();
            }

            switch (selLoc){
                case 1:
                    location= new SafeHouse(player);
                    break;
                case 2:
                    location= new Cave(player);
                break;
                case 3:
                    location= new Forest(player);
                break;
                case 4:
                    location= new River(player);
                break;
                case 5:
                    location = new ToolStore(player);
                    break;
                default:
                    location= new SafeHouse(player);
            }

            if(!location.getLocation()){
                System.out.println("Oyun bitti !!");
                break;
            }
        }
    }
    }


