import * as THREE from './lib/three.module.js';
import { Level, Map, MAP, LevelType } from './levels.js';
import { Objects, Params } from './entity.js';
import { Pacman } from './pacman.js';
import { Blinky, Pinky, Inky, Clyde } from './ghosts.js';

interface Point {
    x: number;
    y: number;
}

interface Index {
    i: number;
    j: number;
}

interface LevelDots {
    dots: Dot[],
    name: LevelType
}

interface LevelCherries {
    cherries: Cherry[],
    name: LevelType
}

class Dot {
    public static readonly Size = 5;
    public readonly i: number;
    public readonly j: number;
    public mesh: THREE.Mesh;

    constructor(i: number, j: number) {
        this.i = i;
        this.j = j;
        this.setMesh();
    }
    public setMesh() {
        let sphere = new THREE.SphereGeometry(Dot.Size, Dot.Size, Dot.Size);
        let material  = new THREE.MeshStandardMaterial({ color: '#fafafa'} );
        this.mesh = new THREE.Mesh(sphere, material);
        this.mesh.position.set(this.getX(), this.getY(), 0);
    }
    public getX() {
        let delta = Params.CellSize / 2;
        let radius = Params.CubeSize / 2;
	    let x = this.j * Params.CellSize - (radius - delta);
        return x;
    }
    public getY() {
        let delta = Params.CellSize / 2;
	    let radius = Params.CubeSize / 2;
        let y = -this.i * Params.CellSize + (radius - delta);
        return y;
    }
}

class Cherry extends Dot {
    public static readonly Length = 5; // x
    public static readonly Height = 15; // y
    public static readonly Width = 15; // z

    constructor(i: number, j: number) {
        super(i, j);
        this.setMesh();
    }
    public setMesh() {
        let cherry_geometry = new THREE.SphereGeometry(Cherry.Length, Cherry.Height, Cherry.Width);
        let cherry_material = new THREE.MeshStandardMaterial({color: "#991c1c"});
        let cherry1 = new THREE.Mesh(cherry_geometry, cherry_material);
        let cherry2 = new THREE.Mesh(cherry_geometry, cherry_material);
        cherry2.position.set(9,5,0); // ?

        let points1 = [];
        points1.push(new THREE.Vector3(0, Cherry.Length - 1, 0));
        points1.push(new THREE.Vector3(0, Cherry.Height - 1, 0));
        let pick_geometry1 = new THREE.BufferGeometry().setFromPoints(points1);
        let pick_material = new THREE.LineBasicMaterial({ color: '#35a12d', linewidth: 5});
        let pick1 = new THREE.Line(pick_geometry1, pick_material);
        cherry1.add(pick1);

        let curve = new THREE.EllipseCurve(0, 10, 8, 9.5, 3.5,  -2.32 * Math.PI, false, 1);
        let points2 = curve.getPoints(50);
        let pick_geometry2 = new THREE.BufferGeometry().setFromPoints(points2);
        let pick2 = new THREE.Line(pick_geometry2, pick_material);
        pick2.rotateY(Math.PI);
        pick2.rotateX(2 * Math.PI);
        cherry2.add(pick2);
        cherry1.add(cherry2);
        this.mesh = cherry1;
        this.mesh.position.set(this.getX(), this.getY(), 0);
    }
    public getX() {
        let delta = Params.CellSize / 2;
        let radius = Params.CubeSize / 2;
	    let x = this.j * Params.CellSize - (radius - delta) - Cherry.Length * 0.8;
        return x;
    }
    public getY() {
        let delta = Params.CellSize / 2;
	    let radius = Params.CubeSize / 2;
        let y = -this.i * Params.CellSize + (radius - delta) - Cherry.Height / 3;
        return y;
    }
}

export class Game {
    private curLevel: LevelType;
    public static readonly map: Map = MAP;
    private levels: Level[];
    public score: number;
    public scoreText: HTMLElement;
    private pacman: Pacman;

    constructor() {
        this.curLevel = 'front';
        this.score = 0;
        this.scoreText = document.getElementById('score');
        this.setLevels();
    }

    public startGame() {
        // TODO
    }

    public restartGame() {
        // TODO
    }

    public findObjects(object: Objects, grid: number[][]) {
        let array: Index[] = [];
        for (let i = 0; i < Params.CubeSize/Params.CellSize; i++)
            for (let j = 0; j < Params.CubeSize/Params.CellSize; j++)
                if (grid[i][j] == object)
                    array.push({ i: i, j: j });
        return array;
    }

    public drawPacman(geometry) {
        this.pacman = new Pacman();
        // создание mesh (модели) пакмана
        let material = new THREE.MeshStandardMaterial({ color: 0xffff33 });
        let pacman = new THREE.Mesh(geometry, material);
        pacman.scale.set(Pacman.Size, Pacman.Size, Pacman.Size);
        pacman.rotateY(-Math.PI / 2);
        pacman.position.set(0, 0, Params.CubeSize / 2 + Pacman.Size);
        return pacman;
    }

    private drawDots() {
        let dots: Dot[] = [];
        let levelDots: LevelDots[] = [];
        for (let level of this.levels)
        {
            let indexes = this.findObjects(Objects.dot, level.grid); // Поиск всех единиц еды
            for (let index of indexes)
            {
                let dot = new Dot(index.i, index.j);
                dots.push(dot);
            }
            levelDots.push({ dots: dots, name: level.name });
            dots = [];
        }
        return levelDots;
    }

    public drawCherries() {
        let cherries: Cherry[] = [];
        let levelCherries: LevelCherries[] = [];
        for (let level of this.levels)
        {
            let indexes = this.findObjects(Objects.cherry, level.grid); // Поиск всех единиц еды
            for (let index of indexes)
            {
                let cherry = new Cherry(index.i, index.j);
                cherries.push(cherry);
            }
            levelCherries.push({ cherries: cherries, name: level.name });
            cherries = [];
        }
        return levelCherries;
    }
    
    public drawLevelPlanes() {
        let geometry = new THREE.PlaneGeometry(Params.CubeSize, Params.CubeSize);
        let material = new THREE.MeshStandardMaterial({color: 0xffffff, transparent: true, opacity: 0.0 });
        
        let sides = [ 'front', 'back', 'right', 'left', 'top', 'bottom' ];
        let planes = {};

        for (let side of sides)
        {
            let offset = { // Добавление дополнительного смещения в половину высоты стены
                x: Game.map[side].offset.x ? (Game.map[side].offset.x > 0 ? Game.map[side].offset.x + Params.Depth/2 : Game.map[side].offset.x - Params.Depth/2) : 0,
                y: Game.map[side].offset.y ? (Game.map[side].offset.y > 0 ? Game.map[side].offset.y + Params.Depth/2 : Game.map[side].offset.y - Params.Depth/2) : 0,
                z: Game.map[side].offset.z ? (Game.map[side].offset.z > 0 ? Game.map[side].offset.z + Params.Depth/2 : Game.map[side].offset.z - Params.Depth/2) : 0
            }
            planes[side] = new THREE.Mesh(geometry, material);
            planes[side].position.set(offset.x, offset.y, offset.z);
            planes[side].setRotationFromEuler(new THREE.Euler(Game.map[side].rotation.x, Game.map[side].rotation.y, Game.map[side].rotation.z));
        }

        let levelDots = this.drawDots();
        for (let level of levelDots)
        {
            for (let dot of level.dots)
            {
                planes[level.name].add(dot.mesh.clone());
            }
        }

        let levelCherries = this.drawCherries();
        for (let level of levelCherries)
        {
            for (let cherry of level.cherries)
            {
                planes[level.name].add(cherry.mesh.clone());
            }
        }

        let planesArray = [];
        sides.forEach(side => {
            planesArray.push(planes[side]);
        });
        return planesArray;
    }

    private drawWalls() {
        let levelWalls = [];
        for (let level of this.levels)
        {
            let walls = this.findObjects(Objects.wall, level.grid); // Поиск всех блоков стен
            let checkedCells = []; this.clearCheckedCells(checkedCells);
            let wallMeshes = [];
            let tempWall: Point[] = [];
            for (let block of walls) // Обход по каждому блоку стены
            {
                let i = block.i; let j = block.j;
                if (level.grid[i][j] != checkedCells[i][j]) {
                    checkedCells[i][j] = Objects.wall;
                    this.tempWallAdd(tempWall, i, j);

                    this.follow(level.grid, 'left', i, j, tempWall, checkedCells);
                    this.follow(level.grid, 'right', i, j, tempWall, checkedCells);
                    
                    let wall = this.truncateWall(tempWall);
                    tempWall = [];
                    let shape = this.drawPath(wall);
                    let extrudeSettings = {
                        steps: 1,
                        depth: Params.Depth,
                        bevelEnabled: false,
                    };
                    let geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                    let material = new THREE.MeshStandardMaterial({ color: level.color });
                    let wallMesh = new THREE.Mesh(geometry, material);
                    wallMesh.position.set(level.offset.x, level.offset.y, level.offset.z);
                    wallMesh.rotation.setFromVector3(new THREE.Vector3(level.rotation.x, level.rotation.y, level.rotation.z));
                    wallMeshes.push(wallMesh);
                }
            }
            levelWalls.push(wallMeshes);
        }
        return levelWalls;
    }

    public drawLevelWalls() {
        let wallArray = [];
        let levelWalls = this.drawWalls();
        for (let level of levelWalls)
        {
            for (let walls of level)
            {
                wallArray.push(walls);
            }  
        }
        return wallArray;
    }
    
    public clearCheckedCells(checkedCells) {
        for (let i = 0; i < Params.Rows; i++)
            checkedCells[i] = [];
    }
    
    private tempWallAdd(tempWall: Point[], i: number, j: number) {
        let cellDelta = Params.CellSize / 2;
        let wallDelta = Params.WallSize / 2;
        let radius = Params.CubeSize / 2;
        let center = { x: j * Params.CellSize - (radius - cellDelta), y: -i * Params.CellSize + (radius - cellDelta)}
        tempWall.push({ x: center.x - wallDelta, y: center.y + wallDelta }); // left top 
        tempWall.push({ x: center.x + wallDelta, y: center.y + wallDelta }); // right top 
        tempWall.push({ x: center.x + wallDelta, y: center.y - wallDelta }); // right bottom
        tempWall.push({ x: center.x - wallDelta, y: center.y - wallDelta }); // left bottom
    }

    private follow(level, direction, i, j, tempWall, checkedCells) { // Рекурсивный метод по сборке стены
        if (level[i][j] == Objects.wall) {
            switch (direction) {
                case 'right':
                    if (j + 1 < Params.CubeSize / Params.CellSize)
                    {
                        if (level[i][j + 1] == Objects.wall && level[i][j + 1] != checkedCells[i][j + 1]) { // Если справа стена
                            this.tempWallAdd(tempWall, i, j + 1);
                            checkedCells[i][j + 1] = Objects.wall;
                            this.follow(level, 'right', i, j + 1, tempWall, checkedCells);
                        } else {
                            this.follow(level, 'down', i, j, tempWall, checkedCells);
                        }
                    }
                    break;
                case 'left':
                    if (j - 1 >= 0)
                    {
                        if (level[i][j - 1] == Objects.wall && level[i][j - 1] != checkedCells[i][j - 1]) { // Если слева стена
                            this.tempWallAdd(tempWall, i, j - 1);
                            checkedCells[i][j - 1] = Objects.wall;
                            this.follow(level, 'left', i, j - 1, tempWall, checkedCells);
                        } else {
                            this.follow(level, 'down', i, j, tempWall, checkedCells);
                        }
                    }
                    break;
                case 'down':
                    if (i + 1 < Params.CubeSize / Params.CellSize)
                    {
                        if (level[i + 1][j] == Objects.wall && level[i + 1][j] != checkedCells[i + 1][j]) { // Если снизу стена
                            this.tempWallAdd(tempWall, i + 1, j);
                            checkedCells[i + 1][j] = Objects.wall;
                            this.follow(level, 'down', i + 1, j, tempWall, checkedCells);
                            this.follow(level, 'left', i + 1, j, tempWall, checkedCells);
                            this.follow(level, 'right', i + 1, j, tempWall, checkedCells);  
                        } 
                    }
                    break;
                case 'up': // TODO: FIX
                    if (i - 1 >= 0)
                    {
                        if (level[i - 1][j] == Objects.wall && level[i - 1][j] != checkedCells[i - 1][j]) { // Если сверху стена
                            this.tempWallAdd(tempWall, i - 1, j);
                            checkedCells[i - 1][j] = Objects.wall;
                            this.follow(level, 'up', i - 1, j, tempWall, checkedCells);
                            this.follow(level, 'right', i - 1, j, tempWall, checkedCells);
                            this.follow(level, 'left', i - 1, j, tempWall, checkedCells);
                        }
                    }
                break;   
            }
        }
    }
    
    private findObjectsAround(level: number[][], i: number, j: number, object: Objects) {
        let result: string[] = [];
        // left
        if (j - 1 >= 0)
            if (level[i][j - 1] == object)
                result.push('left');
        // right
        if (j + 1 < Params.CubeSize / Params.CellSize)
            if (level[i][j + 1] == object)
                result.push('right');
        // up
        if (i - 1 >= 0)
            if (level[i - 1][j] == object)
                result.push('up');
        // down
        if (i + 1 < Params.CubeSize / Params.CellSize)
            if (level[i + 1][j] == object)
                result.push('down');
        return result;
    }

    private truncateWall(tempWall) {
        let wall = [];
        for (let i = 0; i < tempWall.length; i++) {
            let count = 0;
            let point = tempWall[i];
            let gap = Params.CellSize - Params.WallSize;

            let top = this.checkPointToSkip(tempWall, point.x, point.y + Params.WallSize) || this.checkPointToSkip(tempWall, point.x, point.y + gap);
            let bottom = this.checkPointToSkip(tempWall, point.x, point.y - Params.WallSize) || this.checkPointToSkip(tempWall, point.x, point.y - gap);
            let right = this.checkPointToSkip(tempWall, point.x + Params.WallSize, point.y) || this.checkPointToSkip(tempWall, point.x + gap, point.y);
            let left = this.checkPointToSkip(tempWall, point.x - Params.WallSize, point.y) || this.checkPointToSkip(tempWall, point.x - gap, point.y);
            let corners = this.checkPointToSkip(tempWall, point.x - gap, point.y + gap) || 
                          this.checkPointToSkip(tempWall, point.x + gap, point.y + gap) ||
                          this.checkPointToSkip(tempWall, point.x + gap, point.y - gap) ||
                          this.checkPointToSkip(tempWall, point.x - gap, point.y - gap);

            if (top) count++;
            if (bottom) count++;
            if (right) count++;
            if (left) count++; 
            if (corners) count++;

            if (count < 5) wall.push(tempWall[i]);
        }
        return wall;
    }

    private checkPointToSkip(tempWall: Point[], x: number, y: number) { // Пропуск точек внутри фигуры
        return tempWall.some(item => item.x == x && item.y == y);
    }
    
    private drawPath(wall) {
        let head = wall[0];
        let shape = new THREE.Shape();
        shape.moveTo(head.x, head.y);
        this.checkPath(head, wall, shape);
        return shape;
    }
    
    private checkPath(head, wall, shape) {
        let topC = this.findPointAround(head.x, head.y + (Params.CellSize - Params.WallSize), wall);
        let topW = this.findPointAround(head.x, head.y + Params.WallSize, wall);
        let rightC = this.findPointAround(head.x + (Params.CellSize - Params.WallSize), head.y, wall);
        let rightW = this.findPointAround(head.x + Params.WallSize, head.y, wall);
        let leftC = this.findPointAround(head.x - (Params.CellSize - Params.WallSize), head.y, wall);
        let leftW = this.findPointAround(head.x - Params.WallSize, head.y, wall);
        let downC = this.findPointAround(head.x, head.y - (Params.CellSize - Params.WallSize), wall);
        let downW = this.findPointAround(head.x, head.y - Params.WallSize, wall);
    
        let pointsAround = [rightC, rightW, downC, downW, leftC, leftW, topC, topW];
        for (let item of pointsAround) {
            if (!!item) { // Проверка на undefined
                wall.splice(wall.indexOf(item), 1);
                shape.lineTo(item.x, item.y);
                this.checkPath(item, wall, shape);
                break;
            }
        }
    }
    
    private findPointAround(x, y, wall) {
        return wall.find(item => item.x == x && item.y == y);
    }

    
    // Get и Set методы
    public getLevel() {
        return this.curLevel;
    }
    public setLevel(level: LevelType) {
        this.curLevel = level;
    }
    /*public setLevel(level: LevelType) {
        this.switchLevel(); // TODO: Переход на другой уровень
    }*/
    public getLevels() {
        return this.levels;
    }
    private setLevels() {
        this.levels = [];
        this.levels.push(Game.map['front']);
        this.levels.push(Game.map['back']);
        this.levels.push(Game.map['right']);
        this.levels.push(Game.map['left']);
        this.levels.push(Game.map['top']);
        this.levels.push(Game.map['bottom']);
    }
}
