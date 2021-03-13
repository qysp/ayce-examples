(function () {
    'use strict';

    const templateSymbol = Symbol('Ayce::Template');

    const UidGenerator = (function* (id = 0) {
        while (++id)
            yield (id + Math.random()).toString(36);
    })();
    const uid = () => UidGenerator.next().value;
    const createFragment = (html) => {
        const template = document.createElement('template');
        template.innerHTML = html;
        return template.content;
    };

    const generateName = (component) => {
        return `${component.constructor.name}_${uid()}`;
    };
    const process = (subject, args) => {
        if (typeof subject === 'function') {
            subject = subject(args);
        }
        if (typeof subject === 'string') {
            return subject;
        }
        return subject.process(args);
    };
    const defineAyceComponent = (name, component) => {
        if (window.AyceComponents.has(name)) {
            throw new Error(`[Ayce] Error: component with name '${name}' already exists!`);
        }
        window.AyceComponents.set(name, component);
    };
    const createReactivity = (component, state) => {
        return new Proxy(state, {
            get: (target, prop, receiver) => {
                const value = Reflect.get(target, prop, receiver);
                if (typeof value === 'object' && value !== null) {
                    return createReactivity(component, value);
                }
                return value;
            },
            set: (target, prop, value, receiver) => {
                const success = Reflect.set(target, prop, value, receiver);
                if (success && component.$el instanceof HTMLElement && component.$el.__x !== undefined) {
                    component.$el.__x.updateElements(component.$el);
                }
                return success;
            },
        });
    };
    class AyceComponent {
        constructor(props, name) {
            this.name = name ?? generateName(this);
            this.selector = `[x-name="${this.name}"]`;
            defineAyceComponent(this.name, this);
            this.props = props ?? {};
            this.state = createReactivity(this, { ...this.state });
        }
        [templateSymbol]() {
            const substituteArgs = {
                props: this.props,
                state: this.state,
                self: this,
            };
            const html = process(this.template, substituteArgs);
            const fragment = createFragment(html);
            const root = fragment.firstElementChild;
            if (root !== null) {
                root.setAttribute('x-name', this.name);
                root.setAttribute('x-data', `AyceComponents.get('${this.name}')`);
                if (this.styles !== undefined) {
                    const styleElement = document.createElement('style');
                    styleElement.innerHTML = process(this.styles, substituteArgs);
                    root.prepend(styleElement);
                }
            }
            return [...fragment.children].reduce((markup, child) => {
                return markup + child.outerHTML;
            }, '');
        }
    }

    class Processor {
    }
    const ensureArray = (substitute) => {
        return Array.isArray(substitute) ? substitute : [substitute];
    };
    class HtmlProcessor extends Processor {
        constructor(strings, substitutes) {
            super();
            this.strings = strings;
            this.substitutes = substitutes;
        }
        process(args) {
            return this.strings.reduce((html, string, index) => {
                let substitute = this.substitutes[index] ?? '';
                if (typeof substitute === 'function') {
                    substitute = substitute(args);
                }
                for (const item of ensureArray(substitute)) {
                    if (item instanceof AyceComponent) {
                        item.parent = args.self;
                        string += item[templateSymbol]();
                    }
                    else {
                        string += String(item);
                    }
                }
                return html + string;
            }, '');
        }
    }
    class CssProcessor extends Processor {
        constructor(strings, substitutes) {
            super();
            this.strings = strings;
            this.substitutes = substitutes;
        }
        process(args) {
            return this.strings.reduce((css, string, index) => {
                let substitute = this.substitutes[index] ?? '';
                if (typeof substitute === 'function') {
                    substitute = substitute(args);
                }
                string += substitute instanceof AyceComponent
                    ? substitute.selector
                    : String(substitute);
                return css + string;
            }, '');
        }
    }

    function Component(def) {
        return (target) => {
            Object.defineProperties(target.prototype, {
                template: { value: def.template },
                styles: { value: def.styles },
                state: {
                    value: def.state ?? {},
                    writable: true,
                },
            });
        };
    }
    const html = (strings, ...substitutes) => {
        return new HtmlProcessor([...strings], substitutes);
    };
    const css = (strings, ...substitutes) => {
        return new CssProcessor([...strings], substitutes);
    };
    const createApp = (component, root) => {
        const alpine = window.deferLoadingAlpine ?? ((cb) => cb());
        window.deferLoadingAlpine = (callback) => {
            alpine(callback);
            root.innerHTML = component[templateSymbol]();
            window.Alpine.onBeforeComponentInitialized((component) => {
                if (typeof component.$data.onInit === 'function') {
                    component.$data.onInit();
                }
            });
            window.Alpine.onComponentInitialized((component) => {
                if (typeof component.$data.onAfterInit === 'function') {
                    component.$data.onAfterInit();
                }
            });
        };
    };

    if (!('AyceComponents' in window)) {
        window.AyceComponents = new Map();
    }

    var __decorate$9 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    let SourceLink = class SourceLink extends AyceComponent {
    };
    SourceLink = __decorate$9([
        Component({
            template: `
    <a
      :href="props.url"
      target="_blank"
      rel="noopener noreferrer"
      class="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full"
    >
      Source
    </a>
  `,
            styles: ({ self }) => css `
    ${self} {
      top: 5px;
      left: 5px;
      position: fixed;
    }
  `,
        })
    ], SourceLink);

    var __decorate$8 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    let CardGame = class CardGame extends AyceComponent {
        pause(milliseconds = 1000) {
            return new Promise((resolve) => setTimeout(resolve, milliseconds));
        }
        flash(message) {
            window.dispatchEvent(new CustomEvent('flash', {
                detail: { message },
            }));
        }
        get flippedCards() {
            return this.state.cards.filter((card) => card.flipped);
        }
        get clearedCards() {
            return this.state.cards.filter((card) => card.cleared);
        }
        get remainingCards() {
            return this.state.cards.filter((card) => !card.cleared);
        }
        get points() {
            return this.clearedCards.length;
        }
        async flipCard(card) {
            card.flipped = !card.flipped;
            if (this.flippedCards.length !== 2)
                return;
            if (this.hasMatch()) {
                this.flash('You found a match!');
                await this.pause();
                this.flippedCards.forEach((card) => card.cleared = true);
                if (!this.remainingCards.length) {
                    alert('You Won!');
                }
            }
            else {
                await this.pause();
            }
            this.flippedCards.forEach((card) => card.flipped = false);
        }
        hasMatch() {
            const [cardA, cardB] = this.flippedCards;
            return cardA.color === cardB.color;
        }
    };
    CardGame = __decorate$8([
        Component({
            template: `
    <div class="px-10 flex items-center justify-center">
      <h1 class="fixed top-0 right-0 p-10 font-bold text-3xl">
        <span x-text="points"></span>
        <span class="text-xs">pts</span>
      </h1>

      <div class="flex-1 grid grid-cols-4 gap-10">
        <template x-for="(card, index) in state.cards" :key="index">
          <div>
            <button
              x-show="! card.cleared"
              :style="'background: ' + (card.flipped ? card.color : '#999')"
              :disabled="flippedCards.length >= 2"
              class="w-full h-32"
              @click="flipCard(card)"
            ></button>
          </div>
        </template>
      </div>
    </div>
  `,
            state: {
                cards: [
                    { color: 'green', flipped: false, cleared: false },
                    { color: 'red', flipped: false, cleared: false },
                    { color: 'blue', flipped: false, cleared: false },
                    { color: 'yellow', flipped: false, cleared: false },
                    { color: 'green', flipped: false, cleared: false },
                    { color: 'red', flipped: false, cleared: false },
                    { color: 'blue', flipped: false, cleared: false },
                    { color: 'yellow', flipped: false, cleared: false },
                ].sort(() => Math.random() - .5),
            },
        })
    ], CardGame);

    var __decorate$7 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    let FlashMessage = class FlashMessage extends AyceComponent {
        onFlash($event) {
            this.state.message = $event.detail.message;
            this.state.show = true;
            setTimeout(() => this.state.show = false, 1000);
        }
    };
    FlashMessage = __decorate$7([
        Component({
            template: `
    <div
      x-show.transition.opacity="state.show"
      x-text="state.message"
      @flash.window="onFlash($event)"
      class="fixed bottom-0 right-0 bg-green-500 text-white p-2 mb-4 mr-4 rounded"
    >
    </div>
  `,
            state: {
                show: false,
                message: '',
            },
        })
    ], FlashMessage);

    var __decorate$6 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var MemoryApp_1;
    let MemoryApp = MemoryApp_1 = class MemoryApp extends AyceComponent {
        onInit() {
            console.log('Init: Memory App');
        }
    };
    MemoryApp.SourceUrl = 'https://github.com/alpinejs/alpine/blob/master/examples/card-game.html';
    MemoryApp = MemoryApp_1 = __decorate$6([
        Component({
            template: html `
    <div class="text-center py-16">
      ${new SourceLink({ url: MemoryApp_1.SourceUrl })}
      ${new CardGame()}
      ${new FlashMessage()}
    </div>
  `,
        })
    ], MemoryApp);

    var __decorate$5 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    let RenderedIn = class RenderedIn extends AyceComponent {
    };
    RenderedIn = __decorate$5([
        Component({
            template: `
    <p class="text-sm text-gray-900 py-4">
      Rendered in: <strong x-text="props.name"></strong>
    </p>
  `,
        })
    ], RenderedIn);

    var __decorate$4 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    let Counter = class Counter extends AyceComponent {
        onClick() {
            if (this.state.intervalId !== null) {
                this.stop();
            }
            this.start();
        }
        start() {
            --this.state.time;
            this.state.intervalId = setInterval(() => {
                --this.state.time;
                if (this.state.time === 0) {
                    if (this.props.onDone !== undefined) {
                        this.props.onDone();
                    }
                    this.reset();
                }
            }, this.props.tickrate ?? 1000);
        }
        stop() {
            if (this.state.intervalId !== null) {
                clearInterval(this.state.intervalId);
                this.state.intervalId = null;
            }
        }
        reset() {
            this.stop();
            this.state.time = 20;
        }
    };
    Counter = __decorate$4([
        Component({
            template: `
    <button
      x-text="state.time"
      @click="onClick()"
      class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
    ></button>
  `,
            state: {
                intervalId: null,
                time: 20,
            },
        })
    ], Counter);

    var __decorate$3 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    let CounterApp = class CounterApp extends AyceComponent {
        onInit() {
            console.log('Init: Counter App');
        }
        onAfterInit() {
            console.log('After Init: Counter App');
        }
        onDone(name) {
            return () => alert(`${name} -> done!`);
        }
    };
    CounterApp = __decorate$3([
        Component({
            template: ({ self }) => html `
    <div class="text-center">
      ${new RenderedIn({ name: self.parent.name })}
      <div class="pb-4">
        <p class="text-lg font-bold text-gray-900 my-4">
          Counter (1s interval)
        </p>
        ${new Counter({ onDone: self.onDone('Counter 1') })}
      </div>
      <div>
        <p class="text-lg font-bold text-gray-900 my-4">
          Counter (.5s interval)
        </p>
        ${new Counter({ onDone: self.onDone('Counter 2'), tickrate: 500 })}
      </div>
    </div>
  `,
        })
    ], CounterApp);

    var __decorate$2 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    let NavItem = class NavItem extends AyceComponent {
    };
    NavItem = __decorate$2([
        Component({
            template: `
    <button
      @click="props.onClick()"
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full mr-1"
      x-text="props.caption"
    ></button>
  `,
        })
    ], NavItem);

    var __decorate$1 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var TagsApp_1;
    let TagsApp = TagsApp_1 = class TagsApp extends AyceComponent {
        onInit() {
            console.log('Init: Tags App');
        }
        addTag() {
            if (this.newTag !== '') {
                this.state.tags.push(this.newTag);
                this.state.newTag = '';
            }
        }
        removeTag(tag) {
            this.state.tags = this.state.tags.filter((t) => t !== tag);
        }
        onBackspace() {
            if (this.newTag === '') {
                this.state.tags.pop();
            }
        }
        get newTag() {
            return this.state.newTag.trim();
        }
    };
    TagsApp.SourceUrl = 'https://github.com/alpinejs/alpine/blob/master/examples/tags.html';
    TagsApp = TagsApp_1 = __decorate$1([
        Component({
            template: html `
    <div class="bg-grey-lighter px-8 py-16">
      ${new SourceLink({ url: TagsApp_1.SourceUrl })}
      <template x-for="tag in state.tags">
        <input type="hidden" :value="tag">
      </template>

      <div class="max-w-sm w-full mx-auto">
        <div class="tags-input">
          <template x-for="tag in state.tags" :key="tag">
            <span class="tags-input-tag">
              <span x-text="tag"></span>
              <button
                type="button"
                class="tags-input-remove"
                @click="removeTag(tag)"
              >
                &times;
              </button>
            </span>
          </template>

          <input
            class="tags-input-text"
            placeholder="Add tag..."
            @keydown.enter.prevent="addTag()"
            @keydown.backspace="onBackspace()"
            x-model="state.newTag"
          >
        </div>
      </div>
    </div>
  `,
            styles: `
    .tags-input {
      display: flex;
      flex-wrap: wrap;
      background-color: #fff;
      border-width: 1px;
      border-radius: .25rem;
      padding-left: .5rem;
      padding-right: 1rem;
      padding-top: .5rem;
      padding-bottom: .25rem;
    }

    .tags-input-tag {
      display: inline-flex;
      line-height: 1;
      align-items: center;
      font-size: .875rem;
      background-color: #bcdefa;
      color: #1c3d5a;
      border-radius: .25rem;
      user-select: none;
      padding: .25rem;
      margin-right: .5rem;
      margin-bottom: .25rem;
    }

    .tags-input-tag:last-of-type {
      margin-right: 0;
    }

    .tags-input-remove {
      color: #2779bd;
      font-size: 1.125rem;
      line-height: 1;
    }

    .tags-input-remove:first-child {
      margin-right: .25rem;
    }

    .tags-input-remove:last-child {
      margin-left: .25rem;
    }

    .tags-input-remove:focus {
      outline: 0;
    }

    .tags-input-text {
      flex: 1;
      outline: 0;
      padding-top: .25rem;
      padding-bottom: .25rem;
      margin-left: .5rem;
      margin-bottom: .25rem;
      min-width: 10rem;
    }
  `,
            state: {
                tags: ['hey'],
                newTag: '',
            },
        })
    ], TagsApp);

    var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    const routes = [
        { path: '', caption: 'Home' },
        { path: 'counter', caption: 'Counter' },
        { path: 'memory', caption: 'Memory Game' },
        { path: 'tags', caption: 'Tags' },
    ];
    let App = class App extends AyceComponent {
        onRouteChange(route) {
            return () => {
                console.log('Route changed to:', route);
                this.state.route = route;
            };
        }
    };
    App = __decorate([
        Component({
            template: ({ self }) => html `
    <div class="p-8">
      <nav class="text-center">
        ${routes.map(({ path, caption }) => new NavItem({
            onClick: self.onRouteChange(path),
            caption,
        }))}
      </nav>
      <main class="py-8">
        <p x-show="state.route === ''" class="text-center text-3xl font-bold text-gray-900">
          Go ahead and click one of those examples above (:
        </p>
        <template x-if="state.route === 'counter'">
          ${new CounterApp({}, 'CounterApp')}
        </template>
        <template x-if="state.route === 'memory'">
          ${new MemoryApp({}, 'MemoryApp')}
        </template>
        <template x-if="state.route === 'tags'">
          ${new TagsApp({}, 'TagsApp')}
        </template>
      </main>
    </div>
  `,
            state: {
                route: '',
            },
        })
    ], App);
    createApp(new App({}, 'DemoApp'), document.getElementById('root'));

}());
