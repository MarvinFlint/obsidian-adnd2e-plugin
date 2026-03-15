<script lang="ts">
    import type { TFile, Vault } from 'obsidian';
    import { type Item, type Equipment, type FieldType, type FieldSchema, ITEM_FIELDS, type EquipmentSlot } from './types'
    import { EQUIPMENT_SLOTS } from './types';

    export let fileData: Record<string, any> = {};
    export let activeFile: TFile | null = null;
    export let vault: Vault;

    let saveTimeout: number;

    let characterName: string = fileData.characterName ?? '';
    let characterAge: number = fileData.characterAge ?? 18;
    let characterClasses: Array<any> = fileData.characterClasses ?? [];
    const availableClasses: Array<string> = [
        'Fighter',
        'Ranger',
        'Cleric',
        'Thief',
        'Wizard'
    ]
    let attributes: Array<any> = fileData.attributes ?? [
        { name: 'Strength', value: 10, abbr: 'STR' },
        { name: 'Dexterity', value: 10, abbr: 'DEX' },
        { name: 'Constitution', value: 10, abbr: 'CON' },
        { name: 'Wisom', value: 10, abbr: 'WIS' },
        { name: 'Intelligence', value: 10, abbr: 'INT' },
        { name: 'Charisma', value: 10, abbr: 'CHA' },
    ];

    let inventory: Array<Item> = fileData.inventory ?? [];
    let equipment: Equipment = fileData.equipment ?? {};

    $: equippedItems = EQUIPMENT_SLOTS.map(slot => ({
        slot,
        item: inventory.find(i => i.id === equipment[slot]) ?? null
    }));

    async function saveData(){
        clearTimeout(saveTimeout);
        saveTimeout = window.setTimeout(async () => {
            console.log('saving, activeFile is:', activeFile);
            if (!activeFile) return;
            const classesToSave = characterClasses.filter(c => c.className.trim() !== '');
            await vault.modify(activeFile, JSON.stringify({ characterName, attributes, characterClasses : classesToSave, inventory, equipment }))
        })
    }

    function addCharacterClass(){
        characterClasses = [...characterClasses, { className: '', classLevel: 1 }];
    }

    function removeCharacterClass(index: number){
        characterClasses = characterClasses.filter((_, i) => i !== index);
        saveData();
    }

    function openAddItemPanel() {
        const viewContainer = document.querySelector('.view-content');
        console.log(viewContainer);
        if(!viewContainer) return;
        
        const wrapper = document.createElement('div');
        wrapper.classList.add('add-item-wrapper');
        const itemInputs = createAddItemFields();
        wrapper.append(itemInputs);

        const buttons = document.createElement('div');
        buttons.classList.add('create-item-buttons');
        const acceptButton = createButton('Add Item', 'accept-button', addItem);
        const cancelButton = createButton('Cancel', 'cancel-button', closeAddItemPanel);
        buttons.append(acceptButton, cancelButton);

        wrapper.append(buttons);
        viewContainer.append(wrapper);
        console.log(wrapper);
        
    }

    function closeAddItemPanel(){
        const addItemPanel = document.querySelector('.add-item-wrapper');
        addItemPanel?.remove();
    }

    function createAddItemFields(): HTMLElement{
        const itemInputs = document.createElement('div');
        itemInputs.classList.add('item-inputs');
        for(const field of ITEM_FIELDS){
            const row = document.createElement('div');
            row.classList.add('item-input-row');

            const label = document.createElement('label');
            label.textContent = field.label;
            label.htmlFor = `item-field-${ field.key }`;

            const input = createAddItemInput(field);
            input.id = `item-field-${ field.key }`;

            row.append(label, input);
            itemInputs.append(row);
        }
        return itemInputs;
    }

    function createAddItemInput(field: FieldSchema): HTMLElement{
        if(field.type == 'select'){
            const select = document.createElement('select');
            field.options?.forEach((option) => {
                const optionEl = document.createElement('option');
                optionEl.innerText = option;
                optionEl.value = option;
                select.append(optionEl);
            });
            return select;
        }

        const input = document.createElement('input');
        input.type = field.type;
        field.type === 'checkbox' ? input.checked = false : null;
        return input;
    }

    function createButton(text: string, className: string, onClick: () => void): HTMLElement{
        const button = document.createElement('button');
        button.innerText = text;
        button.classList.add(className);
        button.addEventListener('click', onClick);
        return button;
    }

    function addItem() {
        const itemValues = getItemValues();
        inventory = [...inventory, {
                id: crypto.randomUUID(),
                name: itemValues.name || 'New Item',
                description: itemValues.description || '',
                weight: itemValues.weight || 0,
                quantity: itemValues.quantity || 1,
                equipped: false,
                equippable: itemValues.equippable,
                slot: itemValues.slot || null,
                armorClass: itemValues.armorClass,
                magicBonus: itemValues.magicBonus
            }];
        closeAddItemPanel();
        saveData();
    }

    function getItemValues(): Item {
        const getItemValue = (key: string) => {
            return document.getElementById(`item-field-${ key }`) as HTMLInputElement | HTMLSelectElement
        }

        const slot = (getItemValue('slot') as HTMLSelectElement).value;
        const ac = parseInt((getItemValue('armorClass') as HTMLInputElement).value);
        const bonus = parseInt((getItemValue('magicBonus') as HTMLInputElement).value);
        return {
            id: '',
            name: (getItemValue('name') as HTMLInputElement).value,
            description: (getItemValue('description') as HTMLInputElement).value,
            weight: parseFloat((getItemValue('weight') as HTMLInputElement).value),
            quantity: parseFloat((getItemValue('quantity') as HTMLInputElement).value),
            equipped: false,
            equippable: (getItemValue('equippable') as HTMLInputElement).checked,
            slot: slot === 'none' ? null : slot as EquipmentSlot,
            armorClass: ac ? ac : null,
            magicBonus: bonus ? bonus : null
        }
    }

    function equipItem(item: Item){
        if(!item.equippable || !item.slot) return;

        const currentlyEquippedItemID = equipment[item.slot];
        if(currentlyEquippedItemID){
            const current = inventory.find(inventoryItem => inventoryItem.id === currentlyEquippedItemID)
            if(current) current.equipped = false;
        }

        equipment[item.slot] = item.id;
        item.equipped = true;
        equipment = { ...equipment };
        inventory = [ ...inventory ];
        saveData();
    }

    function unequipItem(item: Item){
        if(!item.slot) return;
        delete equipment[item.slot];
        item.equipped = false;
        equipment = { ...equipment };
        inventory = [ ...inventory ];
        saveData();
    }
</script>

<main class="main">
    <section id="character-info">
        <div class="info-item character-basics">
            <h2>Info</h2>
            <label for="charactername">Name</label>
            <input type="text" name="charactername" bind:value={ characterName } on:input={ saveData } />
            <label for="characterage">Age</label>
            <input type="number" name="characterage" bind:value={ characterAge } on:input={ saveData } />
        </div>       
        <div class="info-item character-classes">
            <h2>Classes</h2>
            {#each characterClasses as characterClass, i}
            <div class="characterClass">
                <input type="number" bind:value={ characterClass.classLevel } on:input={ saveData } />
                <select bind:value={ characterClass.className } on:change={ saveData }>
                    {#each availableClasses as availableClass}
                    <option value="{ availableClass }">{ availableClass }</option>
                    {/each}
                </select>
                <button on:click={ () => removeCharacterClass(i) }>-</button>
            </div>
            {/each}
            <button on:click={ () => addCharacterClass() }>+</button>
        </div>
    </section>
    <section id="attributes">
        <h2>Stats</h2>
        {#each attributes as attribute}
            <label for="{ attribute.name }-attribute">{ attribute.abbr }</label>
            <input type="number" name="{ attribute.name }-attribute" bind:value={ attribute.value } on:input={ saveData } />
        {/each}
    </section>
    <section id="inventory">
        <h2>Inventory</h2>
        <ul>
        {#each inventory as item}
            <li class="item-entry">
                <input class="item-input" type="text" placeholder="Name" bind:value={ item.name } on:input={ saveData } />
                <input class="item-input" type="text" placeholder="Weight" bind:value={ item.weight } on:input={ saveData } />
                <input class="item-input" type="number" placeholder="Quantity" bind:value={ item.quantity } on:input={ saveData } />
                <input class="item-input" type="text" placeholder="Description" bind:value={ item.description } on:input={ saveData } />
                {#if item.equippable}
                <input type="checkbox" checked={ item.equipped } on:change={ () => item.equipped ? unequipItem(item) : equipItem(item) } />                {/if}
            </li>
        {/each}
        </ul>    
        <button on:click={ () => openAddItemPanel() }>+</button>    
    </section>
    <section id="equipment">
        <h2>Equipment</h2>
        {#each equippedItems as { slot, item }}
            <div class="slot-entry">
                <span class="slot-name">{slot}</span>
                {#if item}
                    <span>{item.name}</span>
                    <button on:click={() => unequipItem(item)}>unequip</button>
                {:else}
                    <span class="empty">—</span>
                {/if}
            </div>
        {/each}
    </section>
</main>

<style>
    .character-basics{
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }
    #attributes{
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    .character-classes{
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    #inventory ul{
        list-style-type: none;
    }

    :global(.add-item-wrapper){
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--background-secondary);
        border: 1px solid var(--background-modifier-border);
        padding: var(--size-4-4);
        width: 60%;
        min-width: 400px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    :global(.add-item-wrapper .item-inputs){
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 0.5rem 1rem;
    }
    :global(.item-input-row){
        display: contents;
    }
    :global(.create-item-buttons){
        display: flex;
        justify-content: space-between;
    }
    :global(.create-item-buttons .cancel-button){
        background: rgba(200, 0, 0, 0.8);
    }
</style>