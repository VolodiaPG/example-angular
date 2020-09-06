import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {
  buttonBinder,
  longTouchBinder,
  multiTouchBinder,
  Redo,
  swipeBinder,
  tapBinder,
  textInputBinder,
  Undo,
  UndoCollector
} from 'interacto';
import {SetText} from './command/SetText';
import {TextData} from './model/TextData';
import {ClearText} from './command/ClearText';
import {DrawRect} from './command/DrawRect';
import {DeleteElt} from './command/DeleteElt';
import {ChangeColor} from './command/ChangeColor';
import {DeleteAll} from './command/DeleteAll';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('clearbutton')
  private clearButton: ElementRef;

  @ViewChild('textfield')
  private textarea: ElementRef;

  @ViewChild('undo')
  private undoButton: ElementRef;

  @ViewChild('redo')
  private redoButton: ElementRef;

  @ViewChild('canvas')
  private canvas: ElementRef;

  public constructor(private text: TextData) {
  }

  public getText(): string {
    return this.text.text;
  }

  public getUndoRedo(): UndoCollector {
    return UndoCollector.getInstance();
  }

  ngAfterViewInit(): void {
    // ErrorCatcher.getInstance().getErrors().subscribe(err => {
    //   console.error(err);
    // });

    // let stableAxe: number | undefined;
    // let moveAxe: number | undefined;
    // const minDistance = 200;
    // const horizontal = false;
    //
    // (this.canvas.nativeElement as HTMLElement).addEventListener('touchstart', evt => {
    //   moveAxe = horizontal ? evt.changedTouches[0].clientX : evt.changedTouches[0].clientY;
    //   stableAxe = horizontal ? evt.changedTouches[0].clientY : evt.changedTouches[0].clientX;
    //   evt.preventDefault();
    // });
    //
    // (this.canvas.nativeElement as HTMLElement).addEventListener('touchmove', evt => {
    //   if (stableAxe === undefined) {
    //     return;
    //   }
    //
    //   evt.preventDefault();
    //   evt.stopImmediatePropagation();
    //
    //   const stableAxe2 = horizontal ? evt.changedTouches[0].clientY : evt.changedTouches[0].clientX;
    //   if (Math.abs(stableAxe - stableAxe2) > 70) {
    //     stableAxe = undefined;
    //   }
    // });
    //
    // (this.canvas.nativeElement as HTMLElement).addEventListener('touchend', evt => {
    //   if (stableAxe === undefined) {
    //     return;
    //   }
    //
    //   evt.preventDefault();
    //   evt.stopImmediatePropagation();
    //
    //   const moveAxe2 = horizontal ? evt.changedTouches[0].clientX : evt.changedTouches[0].clientY;
    //   // const y2 = evt.changedTouches[0].clientY;
    //
    //   if (Math.abs(moveAxe - moveAxe2) > minDistance) {
    //     console.log('swipe');
    //   }
    // });

    const drawrect = new DrawRect(this.canvas.nativeElement);
    drawrect.setCoords(10, 10, 300, 300);
    drawrect.doIt();

    buttonBinder()
      .on(this.clearButton.nativeElement)
      .toProduce(() => new ClearText(this.text))
      .bind();

    textInputBinder()
      .toProduce(() => new SetText(this.text))
      .then((c, i) => c.text = i.getWidget().value)
      .on(this.textarea.nativeElement)
      .bind();

    buttonBinder()
      .toProduce(() => new Undo())
      .on(this.undoButton.nativeElement)
      .bind();

    buttonBinder()
      .toProduce(() => new Redo())
      .on(this.redoButton.nativeElement)
      .bind();

    longTouchBinder(2000)
      .toProduce(i => new DeleteElt(this.canvas.nativeElement, i.getSrcObject() as SVGElement))
      .onDynamic(this.canvas.nativeElement)
      .when(i => i.getSrcObject() !== this.canvas.nativeElement && i.getSrcObject() instanceof SVGElement)
      // Prevents the context menu to pop-up
      .preventDefault()
      // Consumes the events before the multi-touch interaction and co use them
      .stopImmediatePropagation()
      .bind();

    const boundary = this.canvas.nativeElement.getBoundingClientRect();

    tapBinder(3)
      .toProduce(i => new ChangeColor(i.getTapData()[0].getSrcObject() as SVGElement))
      .onDynamic(this.canvas.nativeElement)
      .when(i => i.getTapData()[0].getSrcObject() !== this.canvas.nativeElement
        && i.getTapData()[0].getSrcObject() instanceof SVGElement)
      .bind();

    multiTouchBinder(2)
      .toProduce(i => new DrawRect(this.canvas.nativeElement as SVGSVGElement))
      .on(this.canvas.nativeElement)
      .then((c, i) => {
        c.setCoords(Math.min(...i.getTouchData().map(touch => touch.getTgtClientX())) - boundary.x,
          Math.min(...i.getTouchData().map(touch => touch.getTgtClientY())) - boundary.y,
          Math.max(...i.getTouchData().map(touch => touch.getTgtClientX())) - boundary.x,
          Math.max(...i.getTouchData().map(touch => touch.getTgtClientY())) - boundary.y);
      })
      .continuousExecution()
      .preventDefault()
      .bind();

    swipeBinder(true, 300, 500, 50)
      .toProduce(i => new DeleteAll(this.canvas.nativeElement))
      .on(this.canvas.nativeElement)
      .when(i => i.getSrcObject() === this.canvas.nativeElement)
      .preventDefault()
      .bind();
  }
}