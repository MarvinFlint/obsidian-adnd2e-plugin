import { ItemView, WorkspaceLeaf } from 'obsidian';
import CharacterSheet from './CharacterSheet.svelte';

export const VIEW_TYPE = 'dnd-character-sheet';

export class ChracterSheetView extends ItemView {
    private component: CharacterSheet;

    getViewType() { return VIEW_TYPE; }
    getDisplayText() { return 'Character Sheet'; }

    async onOpen() {
        this.component = new CharacterSheet({
            target: this.containerEl.children[1],
        })
    }

    async onClose() {
        this.component.$destroy();
    }
}

