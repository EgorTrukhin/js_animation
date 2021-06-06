import React from "react";
import { autobind } from 'core-decorators';
import './AnimatedText.css';

interface IAnimatedText {
  canvas: HTMLCanvasElement;
  canvasContext: CanvasRenderingContext2D;
  mouse: MouseCoords;
  particles: IParticle[];
  textData: ImageData;
}

interface Coordinates {
  x: number;
  y: number;
}

interface MouseCoords {
  coords: Coordinates;
  radius?: number;
}

interface IParticle {
  size: number;
  baseX: number;
  baseY: number;
  getBack: number;
  density: number;
  coords: Coordinates;

  draw(): void;
  update(mouse: MouseCoords): void;
}

interface ParticleProps {
  canvasContext: CanvasRenderingContext2D;
  coords: Coordinates;
}

export default class AnimatedText extends React.Component implements IAnimatedText {
  public canvas: HTMLCanvasElement;
  public canvasContext: CanvasRenderingContext2D;
  public particles: IParticle[] = [];
  public textData: ImageData;

  public mouse: MouseCoords = {
    coords: {
      x: NaN,
      y: NaN,
    },
    radius: 120
  }

  private textHeight = 30;
  private text = "ABOBA";
  private fillColor = "white";
  private bgColor = "white";
  private font = `${this.textHeight}px Arial Black`;
  private scale = 10;
  
  componentDidMount() {
    this.initContext();
    this.animate();
  }

  private initContext() {
    this.canvas = document.getElementById("animated_text") as HTMLCanvasElement;
    this.canvasContext = this.canvas.getContext('2d');
    this.canvas.height = window.innerHeight;
    this.canvas.width = window.innerWidth;
    this.canvasContext.fillStyle = this.fillColor;
    this.canvasContext.lineWidth = 2;

    this.canvas.onmousemove = (event: MouseEvent) => {
      const { x, y } = event;
      this.mouse.coords = { x, y };
    };

    this.printAndGetTextData();
    this.fillParticles();
  }

  private printAndGetTextData() {
    this.canvasContext.font = this.font;
    this.canvasContext.fillText(this.text, 0, this.textHeight);
    this.textData = this.canvasContext.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  private fillParticles() {
    const adjustX = this.canvas.width / 2 - this.scale * this.scale * (this.text.length + 1);
    const adjustY = this.canvas.height / 2 - this.textHeight / 1.5 * this.scale;

    for (let textY = 0; textY < this.textData.height; textY++) {
      for (let textX = 0; textX < this.textData.width; textX++) {
        const idx = (textY * 4 * this.textData.width) + (textX * 4) + 3;
        if (this.textData.data[idx] > 128) {
          const x = textX * this.scale + adjustX;
          const y = textY * this.scale + adjustY;
          this.particles.push(new Particle({
            canvasContext: this.canvasContext,
            coords: { x, y }
          }));
        }
      }
    }
  }

  private connect() {
    for (let a = 0; a < this.particles.length; a++) {
      for (let b = a; b < this.particles.length; b++) {
        const ax = this.particles[a].coords.x;
        const ay = this.particles[a].coords.y;
        const bx = this.particles[b].coords.x;
        const by = this.particles[b].coords.y;
        const dx = ax - bx;
        const dy = ay - by;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 20) {
          const opacityValue = 1 - distance / 50;
          this.canvasContext.strokeStyle = `rgba(255, 170, 255, ${opacityValue})`;

          this.canvasContext.beginPath();
          this.canvasContext.moveTo(ax, ay);
          this.canvasContext.lineTo(bx, by);
          this.canvasContext.stroke();
        }
      }
    }
  }

  @autobind
  private animate() {
    this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].draw();
      this.particles[i].update(this.mouse);
    }
    this.connect();
    requestAnimationFrame(this.animate);
  }

  render() {
    return (
      <>
        <canvas className="animated_text" id="animated_text">
        </canvas>
      </>
    );
  }
}

class Particle<P extends ParticleProps = ParticleProps> extends React.Component<P, {}> implements IParticle {
  size: number = 3;  
  baseX: number = this.props.coords.x;
  baseY: number = this.props.coords.y;
  getBack: number = 10;
  density: number = (Math.random() * 10) + 1; 

  private canvasContext: CanvasRenderingContext2D = this.props.canvasContext;
  public coords: Coordinates = this.props.coords;
  
  draw() {
    this.canvasContext.beginPath();
    this.canvasContext.arc(this.coords.x, this.coords.y, this.size, 0, Math.PI * 2);
    this.canvasContext.closePath();
    this.canvasContext.fill();
  }

  update(mouse: MouseCoords) {
    const { coords, radius } = mouse;
    const dx = coords.x - this.coords.x;
    const dy = coords.y - this.coords.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const maxDistance = radius;
    const motionForce = (maxDistance - distance) / maxDistance;

    const directionXForce = dx / distance;
    const directionYForce = dy / distance;
    const directionX = directionXForce * motionForce * this.density;
    const directionY = directionYForce * motionForce * this.density;

    if (distance < radius) {
      this.coords.x -= directionX;
      this.coords.y -= directionY;
    } else {
      if (this.coords.x !== this.baseX) {
        const dx = this.coords.x - this.baseX;
        this.coords.x -= dx / this.getBack;
      }
      if (this.coords.y !== this.baseY) {
        const dy = this.coords.y - this.baseY;
        this.coords.y -= dy / this.getBack;
      }
    }
  }
}