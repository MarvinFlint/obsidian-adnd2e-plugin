import { Plugin } from 'obsidian';
import { CharacterSheetView, VIEW_TYPE } from './view';

export default class ADnD2eCharacterSheet extends Plugin {
  	async onload() {
		console.log('Loading ADnD 2e Character Sheet plugin 1234');
		this.registerView(VIEW_TYPE, (leaf) => new CharacterSheetView(leaf));
		this.registerExtensions(['2ecs'], VIEW_TYPE);

		this.addRibbonIcon('scroll', 'Add new character sheet', async () => {
			console.log('ribbon clicked');
			const file = await this.app.vault.create('NewCharacter.2ecs', '{}');
			const leaf = this.app.workspace.getLeaf(true);
			await leaf.openFile(file);
		});
		console.log('ribbon icon registered');

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file, source) => {
				menu.addItem((item) => {
					item.setTitle('New Character Sheet')
						.setIcon('scroll')
						.onClick(async () => {
							const newFile = await this.app.vault.create('NewCharacter.2ecs', '{}');
							const leaf = this.app.workspace.getLeaf(true);
							await leaf.openFile(newFile);
						});
				});
			})
		);    

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