import {
  BoardShape,
  Hole,
  IntersectionPoint,
  ParticleEffect,
  Rope,
  ThemeConfig,
} from '../types';
import { DragState } from '../core/RopePhysics';

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
  theme: ThemeConfig;
  shape: BoardShape;
  holes: Hole[];
  ropes: Rope[];
  intersections: IntersectionPoint[];
  selectedRopeId: string | null;
  selectedEnd: 'start' | 'end' | null;
  dragState: DragState | null;
  particles: ParticleEffect[];
  boardShake: { x: number; y: number; trauma: number };
  hintHighlight: { ropeId: string; end: 'start' | 'end'; targetHoleId: number } | null;
  time: number;
}

export class CanvasRenderer {
  /**
   * Main render method called every animation frame.
   */
  public render(rc: RenderContext) {
    const { ctx, width, height, dpr } = rc;

    const VIRTUAL_SIZE = 800;
    const scale = (width / VIRTUAL_SIZE) * dpr;

    ctx.save();
    ctx.scale(scale, scale);
    ctx.clearRect(0, 0, VIRTUAL_SIZE, VIRTUAL_SIZE);

    const centerX = 400;
    const centerY = 400;
    const boardRadius = 310;

    // Apply board shake (juice)
    if (rc.boardShake.trauma > 0) {
      const shakeAmt = Math.pow(rc.boardShake.trauma, 2) * 8;
      const angle = (Math.random() - 0.5) * 0.04 * rc.boardShake.trauma;
      const sx = (Math.random() - 0.5) * shakeAmt * 2;
      const sy = (Math.random() - 0.5) * shakeAmt * 2;

      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      ctx.translate(-centerX + sx, -centerY + sy);
    }

    // 1. Draw Board (Woodcraft Toy Base)
    this.drawBoard(ctx, centerX, centerY, boardRadius, rc);

    // 2. Draw Peg Holes (Recessed Wooden Sockets)
    this.drawHoles(ctx, rc);

    // 3. Draw Hint Guideline if active
    if (rc.hintHighlight) {
      this.drawHintGuide(ctx, rc);
    }

    // 4. Draw Drag Preview Guideline
    if (rc.dragState) {
      this.drawDragPreview(ctx, rc);
    }

    // 5. Draw Ropes (Multi-layered Shadow, Core, Weave, Highlight)
    this.drawRopes(ctx, rc);

    // 6. Draw Peg Caps (Brass / Wooden Pegs in the holes)
    this.drawPegCaps(ctx, rc);

    // 7. Draw Intersections (Pulsing ✕ Markers)
    this.drawIntersections(ctx, rc);

    // 8. Draw Active Particle Effects
    this.drawParticles(ctx, rc);

    ctx.restore();
  }

  /**
   * Builds path geometry for different board shapes (circle, octagon, star)
   */
  private traceShape(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    shape: BoardShape
  ) {
    ctx.beginPath();
    if (shape === 'circle') {
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    } else if (shape === 'octagon') {
      const sides = 8;
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2 - Math.PI / 8;
        const x = cx + Math.cos(a) * radius;
        const y = cy + Math.sin(a) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    } else if (shape === 'star') {
      const points = 16;
      for (let i = 0; i < points; i++) {
        const a = (i / points) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? radius : radius * 0.88;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }
  }

  /**
   * Draws the wooden puzzle board with lathe turnings and rim bevels.
   */
  private drawBoard(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    rc: RenderContext
  ) {
    const { theme, shape } = rc;
    const outerRadius = radius + 46;

    // Outer ambient soft shadow
    ctx.save();
    this.traceShape(ctx, cx, cy + 14, outerRadius, shape);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.filter = 'blur(18px)';
    ctx.fill();
    ctx.restore();

    // Board Base Bevel Rim
    const rimGrad = ctx.createRadialGradient(
      cx - radius * 0.3,
      cy - radius * 0.3,
      radius * 0.2,
      cx,
      cy,
      outerRadius
    );
    rimGrad.addColorStop(0, theme.boardRim);
    rimGrad.addColorStop(0.85, theme.boardDark);
    rimGrad.addColorStop(1, '#110905');

    this.traceShape(ctx, cx, cy, outerRadius, shape);
    ctx.fillStyle = rimGrad;
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.stroke();

    // Inner Wooden Surface
    const boardGrad = ctx.createRadialGradient(
      cx - radius * 0.2,
      cy - radius * 0.2,
      radius * 0.1,
      cx,
      cy,
      radius
    );
    boardGrad.addColorStop(0, theme.boardBase);
    boardGrad.addColorStop(0.7, theme.boardBase);
    boardGrad.addColorStop(1, theme.boardDark);

    this.traceShape(ctx, cx, cy, radius, shape);
    ctx.fillStyle = boardGrad;
    ctx.fill();

    // Concentric Lathe Wood Rings
    ctx.save();
    ctx.strokeStyle = theme.boardGrain;
    ctx.lineWidth = 1.5;

    const ringSteps = [0.35, 0.55, 0.75, 0.90];
    ringSteps.forEach((frac) => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius * frac, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Decorative Center Inlay
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // Center Logo Symbol (Stylized Knot Icon)
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = theme.holeRim;
    ctx.fill();
    ctx.restore();
  }

  /**
   * Draws the holes around the perimeter of the board.
   */
  private drawHoles(ctx: CanvasRenderingContext2D, rc: RenderContext) {
    const { holes, dragState, theme, selectedRopeId, selectedEnd, ropes, time } = rc;

    // Find currently selected hole if any
    let selectedHoleId: number | null = null;
    if (selectedRopeId && selectedEnd) {
      const rope = ropes.find((r) => r.id === selectedRopeId);
      if (rope) {
        selectedHoleId = selectedEnd === 'start' ? rope.startHoleId : rope.endHoleId;
      }
    }

    const holeRadius = 14;

    holes.forEach((h) => {
      const isSelected = h.id === selectedHoleId;
      const isHovered = dragState && dragState.hoverHoleId === h.id;
      const isValidTarget = isHovered && dragState.isValidHover;

      // 1. Hole Outer Shadow & Brass Bevel Collar
      ctx.save();
      ctx.beginPath();
      ctx.arc(h.x, h.y, holeRadius + 2.5, 0, Math.PI * 2);
      ctx.fillStyle = isSelected
        ? '#fbbf24'
        : isValidTarget
        ? '#34d399'
        : isHovered && !isValidTarget
        ? '#f87171'
        : theme.holeRim;
      ctx.fill();

      // 2. Recessed Inner Hole
      ctx.beginPath();
      ctx.arc(h.x, h.y, holeRadius, 0, Math.PI * 2);
      ctx.fillStyle = theme.holeInner;
      ctx.fill();

      // 3. Inner shadow on top edge of the hole for realistic 3D depth
      const innerShadow = ctx.createLinearGradient(h.x, h.y - holeRadius, h.x, h.y + holeRadius);
      innerShadow.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
      innerShadow.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
      innerShadow.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
      ctx.fillStyle = innerShadow;
      ctx.fill();

      // 4. Glow indicator for free holes when a peg is active
      if ((selectedRopeId || dragState) && !h.isOccupied) {
        const pulse = (Math.sin(time * 0.005 + h.id) + 1) * 0.5;
        ctx.beginPath();
        ctx.arc(h.x, h.y, holeRadius + 3 + pulse * 2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(52, 211, 153, ${0.4 + pulse * 0.3})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 5. Selected pulsating halo
      if (isSelected) {
        const pulse = (Math.sin(time * 0.008) + 1) * 0.5;
        ctx.beginPath();
        ctx.arc(h.x, h.y, holeRadius + 6 + pulse * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(251, 191, 36, ${0.6 + pulse * 0.4})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  /**
   * Draws ghost guideline for hints.
   */
  private drawHintGuide(ctx: CanvasRenderingContext2D, rc: RenderContext) {
    const { hintHighlight, holes, time } = rc;
    if (!hintHighlight) return;

    const fromHole = holes.find((h) => h.id === hintHighlight.targetHoleId);
    if (!fromHole) return;

    const pulse = (Math.sin(time * 0.008) + 1) * 0.5;
    ctx.save();
    ctx.beginPath();
    ctx.arc(fromHole.x, fromHole.y, 22 + pulse * 6, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(245, 158, 11, ${0.7 + pulse * 0.3})`;
    ctx.lineWidth = 3.5;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draws the real-time drag preview line.
   */
  private drawDragPreview(ctx: CanvasRenderingContext2D, rc: RenderContext) {
    const { dragState, holes, ropes } = rc;
    if (!dragState) return;

    const rope = ropes.find((r) => r.id === dragState.ropeId);
    if (!rope) return;

    const fixedHoleId =
      dragState.end === 'start' ? rope.endHoleId : rope.startHoleId;
    const fixedHole = holes.find((h) => h.id === fixedHoleId);
    if (!fixedHole) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(fixedHole.x, fixedHole.y);
    ctx.lineTo(dragState.currentX, dragState.currentY);
    ctx.strokeStyle = dragState.isValidHover
      ? 'rgba(52, 211, 153, 0.7)'
      : 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draws physical ropes with realistic cartoon outlines, weave patterns, and untangling dissipation.
   */
  private drawRopes(ctx: CanvasRenderingContext2D, rc: RenderContext) {
    const { ropes, selectedRopeId, selectedEnd, time } = rc;

    // Draw untangled / active ropes
    ropes.forEach((rope) => {
      if (rope.untangleProgress >= 1.0) return; // Completely gone

      const isSelected = rope.id === selectedRopeId;
      const isUntangling = rope.isUntangled;
      const progress = rope.untangleProgress;

      ctx.save();

      // Global alpha for untangling fade out
      if (isUntangling) {
        ctx.globalAlpha = Math.max(0, 1 - progress);
      }

      const pts = rope.particles;
      if (pts.length < 2) {
        ctx.restore();
        return;
      }

      // 1. Drop Shadow onto the wood
      ctx.beginPath();
      ctx.moveTo(pts[0].x + 3, pts[0].y + 6);
      for (let i = 1; i < pts.length; i++) {
        const xc = (pts[i - 1].x + pts[i].x) / 2 + 3;
        const yc = (pts[i - 1].y + pts[i].y) / 2 + 6;
        ctx.quadraticCurveTo(pts[i - 1].x + 3, pts[i - 1].y + 6, xc, yc);
      }
      ctx.lineTo(pts[pts.length - 1].x + 3, pts[pts.length - 1].y + 6);
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.stroke();

      // 2. Dark Outline (Cartoon signature)
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const xc = (pts[i - 1].x + pts[i].x) / 2;
        const yc = (pts[i - 1].y + pts[i].y) / 2;
        ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, xc, yc);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = isSelected ? '#ffffff' : rope.color.shadow;
      ctx.stroke();

      // 3. Main Colored Body
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const xc = (pts[i - 1].x + pts[i].x) / 2;
        const yc = (pts[i - 1].y + pts[i].y) / 2;
        ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, xc, yc);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.lineWidth = 8.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = isUntangling ? '#6ee7b7' : rope.color.primary;
      ctx.stroke();

      // 4. Braided Weave Striping Pattern
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 7;
      ctx.strokeStyle = isUntangling ? '#a7f3d0' : rope.color.weave;
      ctx.stroke();
      ctx.restore();

      // 5. Specular Sheen Highlight Line
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y - 1.5);
      for (let i = 1; i < pts.length; i++) {
        const xc = (pts[i - 1].x + pts[i].x) / 2;
        const yc = (pts[i - 1].y + pts[i].y) / 2 - 1.5;
        ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y - 1.5, xc, yc);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y - 1.5);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = isUntangling ? '#ffffff' : rope.color.highlight;
      ctx.stroke();

      // 6. Untangle Radiance Aura
      if (isUntangling) {
        ctx.save();
        ctx.lineWidth = 18;
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
        ctx.filter = 'blur(4px)';
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    });
  }

  /**
   * Draws the brass / wooden peg heads holding the rope ends.
   */
  private drawPegCaps(ctx: CanvasRenderingContext2D, rc: RenderContext) {
    const { ropes, holes, selectedRopeId, selectedEnd, theme, time } = rc;
    const holesMap = new Map<number, Hole>();
    holes.forEach((h) => holesMap.set(h.id, h));

    ropes.forEach((rope) => {
      if (rope.untangleProgress >= 1.0) return;

      const startHole = holesMap.get(rope.startHoleId);
      const endHole = holesMap.get(rope.endHoleId);

      const ends = [
        { end: 'start' as const, hole: startHole, pt: rope.particles[0] },
        {
          end: 'end' as const,
          hole: endHole,
          pt: rope.particles[rope.particles.length - 1],
        },
      ];

      ends.forEach(({ end, hole, pt }) => {
        if (!hole || !pt) return;

        const isSelected =
          rope.id === selectedRopeId && selectedEnd === end;

        const px = pt.x;
        const py = pt.y;
        const pegRadius = 11;

        ctx.save();

        // Drop shadow of the peg cap
        ctx.beginPath();
        ctx.arc(px + 2, py + 3, pegRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();

        // Peg Rim
        ctx.beginPath();
        ctx.arc(px, py, pegRadius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#fbbf24' : theme.holeRim;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Peg Core matching Rope Color
        ctx.beginPath();
        ctx.arc(px, py, pegRadius - 3.5, 0, Math.PI * 2);
        ctx.fillStyle = rope.color.primary;
        ctx.fill();

        // Specular highlight on peg
        ctx.beginPath();
        ctx.arc(px - 2.5, py - 2.5, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();

        // Selected Halo Pulse
        if (isSelected) {
          const pulse = (Math.sin(time * 0.01) + 1) * 0.5;
          ctx.beginPath();
          ctx.arc(px, py, pegRadius + 6 + pulse * 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(251, 191, 36, ${0.7 + pulse * 0.3})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        ctx.restore();
      });
    });
  }

  /**
   * Draws active intersection nodes with pulsing ✕ symbols.
   */
  private drawIntersections(ctx: CanvasRenderingContext2D, rc: RenderContext) {
    const { intersections, time } = rc;

    intersections.forEach((inter) => {
      const pulse = (Math.sin(time * 0.008 + inter.pulsePhase) + 1) * 0.5;
      const size = 11 + pulse * 2.5;

      ctx.save();
      ctx.translate(inter.x, inter.y);

      // 1. Soft warning aura
      ctx.beginPath();
      ctx.arc(0, 0, size + 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(239, 68, 68, ${0.25 + pulse * 0.2})`;
      ctx.fill();

      // 2. Red Crossing Badge
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fillStyle = '#dc2626';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fee2e2';
      ctx.stroke();

      // 3. Crisp white ✕ symbol
      ctx.beginPath();
      const arm = size * 0.45;
      ctx.moveTo(-arm, -arm);
      ctx.lineTo(arm, arm);
      ctx.moveTo(arm, -arm);
      ctx.lineTo(-arm, arm);
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.restore();
    });
  }

  /**
   * Updates and draws custom particle effects.
   */
  private drawParticles(ctx: CanvasRenderingContext2D, rc: RenderContext) {
    const { particles } = rc;

    particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha * (p.life / p.maxLife));

      if (p.type === 'spark' || p.type === 'wood_chip') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      } else if (p.type === 'ring') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else if (p.type === 'note') {
        ctx.font = `${Math.round(p.size * 14)}px Outfit, sans-serif`;
        ctx.fillStyle = p.color;
        ctx.fillText('♪', p.x, p.y);
      }

      ctx.restore();
    });
  }
}

export const canvasRenderer = new CanvasRenderer();
