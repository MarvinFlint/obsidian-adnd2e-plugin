import { ItemView, WorkspaceLeaf } from 'obsidian';

export const VIEW_TYPE = 'dnd-character-sheet';

export class ChracterSheetView extends ItemView {
    getViewType() { return VIEW_TYPE; }
    getDisplayText() { return 'Character Sheet'; }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl('h1', { text: 'Character Sheet' });
    }

    async onClose() {
        
    }
}