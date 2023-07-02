import java.util.Scanner;

public class Game {

    Player player;
    Location location;

    public void login(){
        Scanner scan= new Scanner(System.in);
        System.out.println("Welcome to the Adventure Game !");
        System.out.print("Before you, please type your name : ");
        String playerName = scan.nextLine();

        player= new Player(playerName);  // player object assigned the new constror
        player.selectCha();
    }
}
