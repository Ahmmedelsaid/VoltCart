import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CountUp } from './count-up';
import { Reveal } from './reveal';

@Component({
  imports: [Reveal, CountUp],
  template: `
    <div id="box" [appReveal]="120">box</div>
    <span id="count" [appCountUp]="42" suffix="+"></span>
  `,
})
class Host {}

describe('motion directives', () => {
  afterEach(() => vi.unstubAllGlobals());

  async function render() {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows elements right away when IntersectionObserver is not available', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const element = await render();

    const box = element.querySelector('#box')!;
    expect(box.classList.contains('reveal')).toBe(true);
    expect(box.classList.contains('is-visible')).toBe(true);
    expect((box as HTMLElement).style.getPropertyValue('--reveal-delay')).toBe('120ms');
  });

  it('waits until the element enters the screen, then reveals it once', async () => {
    // الـ Reveal والـ CountUp كل واحد عمل observer، فبنسجّلهم كلهم
    const callbacks: IntersectionObserverCallback[] = [];
    const disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          callbacks.push(cb);
        }
        observe = vi.fn();
        disconnect = disconnect;
      },
    );

    const element = await render();
    const box = element.querySelector('#box')!;
    expect(box.classList.contains('is-visible')).toBe(false);

    for (const callback of callbacks) {
      callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    }
    expect(box.classList.contains('is-visible')).toBe(true);
    expect(disconnect).toHaveBeenCalled();
  });

  it('shows the final number straight away without IntersectionObserver', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const element = await render();

    expect(element.querySelector('#count')!.textContent).toBe('42+');
  });
});
