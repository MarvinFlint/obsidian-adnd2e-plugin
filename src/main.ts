import { Plugin } from 'obsidian';
import { CharacterSheetView, VIEW_TYPE } from './view';

export default class ADnD2eCharacterSheet extends Plugin {
  async onload() {
    console.log('Loading ADnD 2e Character Sheet plugin');
    this.registerView(VIEW_TYPE, (leaf) => new CharacterSheetView(leaf));
    this.registerExtensions(['2ecs'], VIEW_TYPE);

    this.addCommand({
      id: 'new-character-sheet',
      name: 'New Character Sheet',
      callback: async () => {
        const file = await this.app.vault.create('NewCharacter.2ecs', '{}');
        const leaf = this.app.workspace.getLeaf(true);
        await leaf.openFile(file);
      }
    });
  }
  async onunload() {
    console.log('Unloading ADnD 2e Character Sheet plugin');
  }

  
}