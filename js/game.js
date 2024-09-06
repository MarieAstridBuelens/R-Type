let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 320,
    physics: {
        default: 'arcade'
    },
    scene: {
        init: init,
        preload: preload,
        create: create,
        update: update
    },
    autoCenter: true,
    audio: {
        disableWebAudio: true
    }
};

let game = new Phaser.Game(config);
let playerShipIMage;
let cursors, spacebar;
let missiles1;
let missiles2;
let enemyImage;
let enemies1;
let boss;
let weakSpot;
let ENEMYNUMBER, MISSILE1NUMBER, MISSILEVELOCITY, MISSILE2NUMBER, MISSILEBOSSNUMBER, BOSSHP;
let bossTimer;
let t;

let backgroundMusic;
let explosionAnimation;
let explosionSound;
let isPlaying;
let isPlayingMusic = false;

let playButton;
let startText;
let endText;


function init() {
    ENEMYNUMBER = 5;
    MISSILE1NUMBER = 50;
    MISSILE2NUMBER = 50;
    MISSILEBOSSNUMBER = 50;
    MISSILEVELOCITY = 100;
    BOSSHP = 25;
    isPlaying = false;
    isPlayingMusic = false;
    t = 0;
}
   
function preload() {
    this.load.image('player', './assets/images/ship.png');
    this.load.image('missile1', './assets/images/bullets.png');
    this.load.image('missile2', './assets/images/star2.png');
    this.load.image('enemy', './assets/images/ennemy.png');
    this.load.image('groundEnemyImage', './assets/images/groundennemy.png');
    this.load.image('bossImage', './assets/images/boss.gif');
    this.load.image('weakSpot', './assets/images/orangeball.png');
    this.load.image('playButton', './assets/images/orbs/norm.png');

    this.load.audio('backgroundMusic', './assets/audio/Pressure.wav');
    this.load.audio('explosionSound', './assets/audio/explosion.wav');
    this.load.audio('laserSound', './assets/audio/laserShoot.wav');

    this.load.spritesheet('exAnim', './assets/animations/explosion.png',//annonce que c'est une suite d'images
        { frameWidth: 128,
        frameHeight: 128 });//dimension de chaque sprite sur la sheet !
    
    //sprite sheet
    this.load.image('tiles', './assets/images/tiles.png');
    this.load.tilemapTiledJSON('backgroundMap', './assets/tiled/niveau1-v2.json');
    }

function create() {

    //test Mode
    // this.cameras.main.scrollX = 2390;
    // ENEMYNUMBER = 0; 
    // MISSILE2NUMBER = 0;
    // MISSILEVELOCITY = 100;
    // isPlaying = true;

    //map
    let map = this.make.tilemap({ key: 'backgroundMap' });
    let sciti = map.addTilesetImage('Sci-Fi', 'tiles', 16, 16, 0, 0);//0 de marge et 0 d'espacement
    let layer = map.createStaticLayer(0, sciti, 0, 0);//1er 0 = position
    layer.setCollisionBetween(1, 55000); //le layer provoque une collision. On spécifie les index
    //des tuiles qui provoquent la collision. Comme on sait pas combien c'était on met un truc très grand.
    //le compte just (3200) ça marche aussi).

    //enemyImage = this.physics.add.image(850, Phaser.Math.Between(50, 270), 'enemy');
    //enemyImage.setVelocity(-100, 0);
    enemies1 = this.physics.add.group ({
        defaultKey:'enemy',
        maxSize: ENEMYNUMBER
    });

    //ground enemy
    groundEnemyImage = this.add.image(1500, 300, 'groundEnemyImage');

    missiles2 = this.physics.add.group ({//création d'un pool de 50 petits missiles
        defaultKey:'missile2',
        maxSize: MISSILE2NUMBER
    });

    //boss
    boss = this.physics.add.image(3200 - 115, 160, 'bossImage').setImmovable(true);
    //setImmovable() pour éviter qu'un objet se fasse la malle lors d'une collision
    weakSpot = this.physics.add.image(3200 - 115, 160, 'weakSpot').setImmovable(true);
    weakSpot.setScale(1.5);
    //munitions boss
    missiles3 = this.physics.add.group ({//création d'un pool de 50 missiles
        defaultKey:'missile2',
        maxSize: MISSILEBOSSNUMBER
    });

    //joueur
    playerShipImage = this.physics.add.image(100, 160, 'player');
    
    //commandes
    cursors = this.input.keyboard.createCursorKeys();//création d'un curseur, càd touche clavier
    spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    //munitions player
    missiles1 = this.physics.add.group ({//création d'un pool de 50 petits missiles
        defaultKey:'missile1',
        maxSize: MISSILE1NUMBER
    });
    //crée un timer pour spawn les missiles sol
    enemyTimer = this.time.addEvent({
        delay: 2000, // ms
        callback: shootGroundEnemy,
        callbackScope: this,
        repeat: 12
        });

    //crée un timer pour spawn les ennemis
    enemyTimer2 = this.time.addEvent({
        delay: 5000, // ms
        callback: spawnEnemy,
        callbackScope: this,//on passe à la fonction spawnEnemy le this
        repeat: ENEMYNUMBER - 1
        });  

    //collider
    this.physics.add.collider(missiles1, enemies1, collisionEnemyMissile, null, this);//si collision entre un missile du groupe et un ennemi du groupe,
    //on appelle la fonction en 3e paramètre
    this.physics.add.collider(playerShipImage, enemies1, collisionPlayerEnemy, null, this);
    this.physics.add.collider(playerShipImage, missiles2, collisionPlayerMissile, null, this);
    this.physics.add.collider(playerShipImage, layer, collisionPlayerLayer, null, this);
    this.physics.add.collider(playerShipImage, boss, collisionPlayerBoss, null, this);
    this.physics.add.collider(missiles1, weakSpot, collisionMissileWeakSpot, null, this);
    this.physics.add.collider(playerShipImage, missiles3, collisionPlayerMissileBoss, null, this);


    //création de l'animation d'explosion
    explosionAnimation = this.anims.create({
        key: 'explode',//alias, comme l'explosion s'appelera
        frames: this.anims.generateFrameNumbers('exAnim'),//"tu prends toutes les frames"
        //c'est ici qu'on ne prend qu'une partie des frames si une seule sheet contenait pls animations
        frameRate: 20,//frames par sec
        repeat: 0,
        hideOnComplete: true//quand l'animation est terminée, cache l'animation
        //false quand un bonhomme meurt et doit rester visible
        });
    
    
    //audio
    explosionSound = this.sound.add('explosionSound');
    laserSound = this.sound.add('laserSound');
    
    //UI
    playButton = this.add.image(400, 160, 'playButton').setInteractive();
    playButton.alpha = 1;
    playButton.on('pointerdown', startGame);

    startText = this.add.text(50, 70, "R-Type\nPress to Play", 
        { fontFamily: 'Monospace', fontSize: 36, color: '#ffffff' });
    startText.alpha = 1;

    endText = this.add.text(2440, 70, "Congratulations!\nYou beat Zogrox!", 
        { fontFamily: 'Monospace', fontSize: 36, color: '#ffffff' });
    endText.alpha = 0;

    //music
    backgroundMusic = this.sound.add('backgroundMusic');
    backgroundMusic.loop = true;
}

function startGame(){

    if (isPlayingMusic == false){
        backgroundMusic.play();
        isPlayingMusic = true;
    }
    playButton.alpha = 0;
    startText.alpha = 0;
    playButton.disableInteractive();
    playerShipImage.setVelocity(100, 0);
    isPlaying = true;
}

function update() {

    if (isPlaying){
        //boss se met à flinguer
        if(this.cameras.main.scrollX == 2395){
            this.time.addEvent({
                delay: 2000, // ms
                callback: shootBoss,
                callbackScope: this,
                repeat: -1
                });
        }
        
        //Scrolling
        if (this.cameras.main.scrollX<2400) this.cameras.main.scrollX += 1;

        //déplacement
        if (cursors.right.isDown) playerShipImage.setVelocity(100, 0);
        if (cursors.left.isDown) playerShipImage.setVelocity(-100, 0);
        if (cursors.up.isDown) playerShipImage.setVelocityY(-100);
        if (cursors.down.isDown) playerShipImage.setVelocityY(100);

        //vérifier si joueur presse la barre espace
        if (Phaser.Input.Keyboard.JustDown(spacebar)){//JustDown : ça veut dire juste quand on enfonce la touche, pas en continu !!!
            let missile = missiles1.get();
            if (missile) {
                missile.setPosition(playerShipImage.x + 22, playerShipImage.y + 7);
                missile.setVelocity(200, 0);
                laserSound.play();
            }
        }

        //vaisseau restant à l'écran en respectant le scroll
        if (playerShipImage.x < this.cameras.main.scrollX + 17) playerShipImage.x = this.cameras.main.scrollX + 17;
        if (playerShipImage.x > this.cameras.main.scrollX + 783) playerShipImage.x = this.cameras.main.scrollX + 783;

        //récupérer les missiles1
        // missiles1.getChildren().forEach(//pour chacun des enfants du groupe
        // function(missile) {
        //     if (missile.y>320 || missile.y< 0 || missile.x < 0 || missile.x > 800) missile.destroy();//détruit un flocon pour le remettre dans le pool
        // }, this);

        //récupérer les missiles2
        // missiles2.getChildren().forEach(//pour chacun des enfants du groupe
        // function(missile2) {
        //     if (missile2.y>320 || missile2.y< 0 || missile2.x < 0 || missile2.x > 800) missile2.destroy();
        // }, this);

        //récupérer les missiles3
        missiles3.getChildren().forEach(//pour chacun des enfants du groupe
        function(missile3) {
            if (missile3.y < -10 || missile3.y > 350 || missile3.x < 0 || missile3.x < 1600) missile3.destroy();
        }, this);        
    }
    

    
}

function spawnEnemy(){
    let enemy = enemies1.get();
    if(enemy)//génère un flocon à chaque frame ! C'est pourquoi ne tombent pas tous en même temps !
        {
            enemy.setPosition(this.cameras.main.scrollX + 810, Phaser.Math.Between(50, 270));
            enemy.setVelocity(-100, 0);
            let rotatingTween = this.tweens.add({ // un objet avec pleins de proprietes
                targets: enemy,//objet impacté
                angle: 360,//propriete impactée
                duration: 5000,//en ms
                ease: "linear",//fonction de easing. La linéaire permet ici d'éviter des allers-retours
                yoyo: false,
                loop: -1//activée à l'infini
        })
        }
}

function collisionEnemyMissile(missile, enemy){
    missile.destroy();
    enemy.destroy();
    let explosionAnim = this.add.sprite(enemy.x, enemy.y);
        explosionAnim.play('explode');
    explosionSound.play();
}

function collisionPlayerEnemy(player, enemy){
    player.destroy();
    enemy.destroy();
    let explosionAnim = this.add.sprite(player.x, player.y);
        explosionAnim.play('explode');
    isPlaying = false;
    explosionSound.play();
}

function collisionPlayerMissileBoss(player, missile){
    missile.destroy();
    player.destroy();
    let explosionAnim = this.add.sprite(player.x, player.y);
        explosionAnim.play('explode');
    isPlaying = false;
    explosionSound.play();
}

function collisionPlayerLayer(player, layer){
    player.destroy();
    let explosionAnim = this.add.sprite(player.x, player.y);
        explosionAnim.play('explode');
    isPlaying = false;
    explosionSound.play();
}

function collisionPlayerBoss(player, boss){
    let explosionAnim = this.add.sprite(player.x, player.y);
        explosionAnim.play('explode');
    player.destroy();
    isPlaying = false;
    explosionSound.play();
}

function collisionMissileWeakSpot(weakSpot, missile){
    let explosionAnim = this.add.sprite(missile.x, missile.y);
        explosionAnim.play('explode');
        missile.destroy();
    
    if (playerShipImage.x > 2350){
        explosionSound.play();
        BOSSHP -= 1;
    }
    
    if (BOSSHP<= 0){
        isPlaying = false;
        //final();
        for (let i = 0; i < 10; i++){
            let explosionAnim = this.add.sprite(boss.x + Phaser.Math.Between(-115, 115), boss.y + Phaser.Math.Between(-77, 77));
            explosionAnim.play('explode');
            explosionSound.play();
        }
        boss.destroy();
        weakSpot.destroy();
        endText.alpha = 1;
    }
}

function collisionPlayerMissile(player, missile){
    missile.destroy();
    player.destroy();
    let explosionAnim = this.add.sprite(player.x, player.y);
        explosionAnim.play('explode');
    isPlaying = false;
    explosionSound.play();
}

function shootGroundEnemy(){
    let missile = missiles2.get();
        if (missile) {
            missile.setPosition(groundEnemyImage.x, groundEnemyImage.y -10);
            let longueurVecteur = ((playerShipImage.x - groundEnemyImage.x)**2 + (playerShipImage.y - groundEnemyImage.y)**2)**(0.5);
            //=Math.sqrt() (=squareroot), c'est une fonction
            //** = exposant
            missile.setVelocity(((playerShipImage.x - groundEnemyImage.x)/longueurVecteur) * MISSILEVELOCITY, ((playerShipImage.y - groundEnemyImage.y)/longueurVecteur)*MISSILEVELOCITY);
            //problème : plus on est loin, plus la vitesse est grande car le vecteur st plus long.
            //faut normer, le ramener à une mesure de 1 en le divisant par sa longueur
            //quandf c'est normé, faut multipilier par la vitesse désirée
            missile.tint = 0xffdbef;
        }
}

function shootBoss(){
    if(isPlaying){
        let missileA = missiles3.get();
        let missileB = missiles3.get();
        let missileC = missiles3.get();
            if (missileA) {
                missileA.setPosition(boss.x - 110, boss.y);
                missileA.setVelocity(-75, 0);
                missileA.setScale(2);
                missileA.tint = 0xff2323;
            }
    
            if (missileB) {
                missileB.setPosition(boss.x - 110, boss.y);
                missileB.setVelocity(-75, -30);
                missileB.setScale(2);
                missileB.tint = 0xff2323;
            }
    
            if (missileC) {
                missileC.setPosition(boss.x - 110, boss.y);
                missileC.setVelocity(-75, 30);
                missileC.setScale(2);
                missileC.tint = 0xff2323;
            }
    }
    
}



