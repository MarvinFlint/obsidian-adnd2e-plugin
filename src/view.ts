import { FileView, WorkspaceLeaf } from 'obsidian';
import CharacterSheet from './CharacterSheet.svelte';

export const VIEW_TYPE = 'dnd-character-sheet';

export class CharacterSheetView extends FileView {
    private component!: CharacterSheet;

    getViewType() { return VIEW_TYPE; }
    getDisplayText() { return this.file?.basename ?? 'Character Sheet'; }

    async onLoadFile() {
        const container = this.containerEl.children[1];
        container.empty();

        let fileData = {};
        if (this.file) {
            const content = await this.app.vault.read(this.file);
            fileData = JSON.parse(content);
        }

        this.component = new CharacterSheet({
            target: container,
            props: { fileData, activeFile: this.file, vault: this.app.vault }
        });
    }

    async onUnloadFile() {
        this.component?.$destroy();
    }
}