import * as THREE from "./three.module.js";
import { Entity, Objects } from './entity.js';

export class Pacman extends Entity {
    constructor() {
        super();
        this.material = new THREE.MeshLambertMaterial({ color: '#FF1FF8' });
        this.size = 12;
        this.animationTime = 120;
        this.type = Objects.pacman;
    }

    public updateCell(grid: number[][]) { // Привязать после движения
        grid[this.cell.i][this.cell.j] = Objects.blank;
        grid[this.cell.i - this.movement.y][this.cell.j + this.movement.x] = Objects.pacman;
        this.cell.i -= this.movement.y;
        this.cell.j += this.movement.x;
    }

}