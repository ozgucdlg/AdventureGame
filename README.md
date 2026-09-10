
# Adventure Game Application

## Introduction

That project aims that is going to show up object-orientated approach and how to implement the main principles such as encapsulation, abstraction, inheritance, and polymorphism. This game is a survival game and begins at Safe HOUSE. There are users(characters __Samurai, Archer, Cavailer__) and some obstacles, There has been a battle in between. There are various places where is being used such as Rivers, Forest, and Cave. Moreover; Each place has its own specific features. After that battle, one of the players beat to other one and the battle ends. 
## Technologies
 - Git/Github,
 - Java 11,

 ## Architecture

![Adventure Game Architecture](https://github.com/ozgucdlg/AdventureGame/blob/master/game.png)

 ## Web UI
A browser UI is available alongside the original console game. It is served by a small
embedded HTTP server (`GameServer`, using only the JDK's built-in `com.sun.net.httpserver`)
that drives the same game rules through `WebGame`, a non-blocking, step-by-step port of the
original console flow.

To run it:
```
javac -d out src/*.java
java -cp out GameServer
```
Then open http://localhost:8080 in a browser (run the command from the repository root so
the server can find the `web/` folder). Pass a port number as an argument to use a different
port, e.g. `java -cp out GameServer 9000`.

The original console game still works unchanged via `java -cp out Main`.

 ## Test
 The application has been tested with debugging and each scenario was monitored(__Happy path, Edge case__, etc).

## Deployment
The application was deployed on GitHub applying each step of sprints. There is only one branch which is __master__.

## Improvements
 - Handle  hardware updates,
 - The necessities of Time management in the real-time project,
 - Agile techniques with implementations.
 - Obtained how to work colloboratively.
 

 
