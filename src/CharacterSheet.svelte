<script lang="ts">
    import type { TFile, Vault } from 'obsidian';

    export let fileData: Record<string, any> = {};
    export let activeFile: TFile | null = null;
    export let vault: Vault;

    let saveTimeout: number;

    let characterName = fileData.characterName ?? '';
    let strength = fileData.strength ?? 10;

    async function saveData(){
        clearTimeout(saveTimeout);
        saveTimeout = window.setTimeout(async () => {
            console.log('saving, activeFile is:', activeFile);
            if (!activeFile) return;
            await vault.modify(activeFile, JSON.stringify({ characterName, strength }))
        })
    }
</script>

<input type="text" bind:value={ characterName } on:input={ saveData } />
<input type="number" bind:value={ strength } on:input={ saveData } />