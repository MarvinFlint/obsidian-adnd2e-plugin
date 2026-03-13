import { Plugin } from 'obsidian';
import { ChracterSheetView, VIEW_TYPE } from './view';

export default class ADnD2eCharacterSheet extends Plugin {
  async onload() {
    console.log('Loading ADnD 2e Character Sheet plugin');
    this.registerView(VIEW_TYPE, (leaf) => new ChracterSheetView(leaf));
    this.registerExtensions(['2ecs'], VIEW_TYPE);
  }
  async onunload() {
    console.log('Unloading ADnD 2e Character Sheet plugin');
  }
}