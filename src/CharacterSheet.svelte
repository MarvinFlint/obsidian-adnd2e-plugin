<script lang="ts">
    import type { TFile, Vault, MarkdownView, Editor } from 'obsidian';
    import { type Item, type Equipment, type FieldType, type FieldSchema, ITEM_FIELDS, type EquipmentSlot } from './types'
    import { EQUIPMENT_SLOTS, AVAILABLE_CLASSES } from './types';
    import { type Proficiency, type ProficiencyType } from './types';

    export let fileData: Record<string, any> = {};
    export let activeFile: TFile | null = null;
    export let vault: Vault;

    let saveTimeout: number;

    let characterName: string = fileData.characterName ?? '';
    let characterAge: number = fileData.characterAge ?? 18;
    let characterWeight: number = fileData.characterWeight ?? null;
    let characterBackground: string = fileData.characterBackground ?? '';
    let characterClasses: Array<any> = fileData.characterClasses ?? [];

    
    let attributes: Array<any> = fileData.attributes ?? [
        { name: 'Strength', value: 10, abbr: 'STR' },
        { name: 'Dexterity', value: 10, abbr: 'DEX' },
        { name: 'Constitution', value: 10, abbr: 'CON' },
        { name: 'Wisom', value: 10, abbr: 'WIS' },
        { name: 'Intelligence', value: 10, abbr: 'INT' },
        { name: 'Charisma', value: 10, abbr: 'CHA' },
    ];

    let weaponProficiencies: Array<Proficiency> = fileData.weaponProficiencies ?? [];
    let nonWeaponProficiencies: Array<Proficiency> = fileData.nonWeaponProficiencies ?? [];

    let inventory: Array<Item> = fileData.inventory ?? [];
    let equipment: Equipment = fileData.equipment ?? {};

    $: inventoryWeight = inventory.reduce((sum, item) => sum + (Number(item.weight) || 0) * item.quantity, 0);
    $: totalWeight = inventoryWeight + characterWeight;

    $: equippedItems = EQUIPMENT_SLOTS.map(slot => ({
        slot,
        item: inventory.find(i => i.id === equipment[slot]) ?? null
    }));

    async function saveData(){
        clearTimeout(saveTimeout);
        saveTimeout = window.setTimeout(async () => {
            if (!activeFile) return;
            const classesToSave = characterClasses.filter(c => c.className.trim() !== '');
            await vault.modify(activeFile, JSON.stringify({ 
                characterName, 
                characterBackground,
                attributes,
                weaponProficiencies,
                nonWeaponProficiencies, 
                characterClasses : classesToSave, 
                inventory, 
                equipment 
            }))
        })
    }

    function addCharacterClass(){
        characterClasses = [...characterClasses, { className: '', classLevel: 1 }];
    }

    function removeCharacterClass(index: number){
        characterClasses = characterClasses.filter((_, i) => i !== index);
        saveData();
    }

    function addProficiency(type: ProficiencyType){        
        type === 'weapon' ? 
            weaponProficiencies = [...weaponProficiencies, { name: '', type: type, slots: 0, source: null }]
            : nonWeaponProficiencies =  [...nonWeaponProficiencies, { name: '', type: type, slots: 0, source: null }]
    }

    function removeProficiency(index: number, type: string){
        type === 'weapon' ?
            weaponProficiencies = weaponProficiencies.filter((_, i) => i !== index)
            : nonWeaponProficiencies = nonWeaponProficiencies.filter((_, i) => i !== index);
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
            <label for="characterweight">Weight</label>
            <input type="number" name="characterweight" bind:value= { characterWeight } on:input={ saveData } />
            <span>Total Weight: { totalWeight }</span>
        </div>    
        <div class="info-item character-background">
            <h2>Background</h2>
            <textarea bind:value={ characterBackground } on:input={ saveData } />
        </div>   
        <div class="info-item character-classes">
            <h2>Classes</h2>
            {#each characterClasses as characterClass, i}
            <div class="characterClass">
                <input type="number" bind:value={ characterClass.classLevel } on:input={ saveData } />
                <select bind:value={ characterClass.className } on:change={ saveData }>
                    {#each AVAILABLE_CLASSES as availableClass}
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
        <ul class="attributes-list">
            {#each attributes as attribute}
            <li>
                <label for="{ attribute.name }-attribute">{ attribute.abbr }</label>
                <input type="number" name="{ attribute.name }-attribute" bind:value={ attribute.value } on:input={ saveData } />
            </li>
            {/each}
        </ul>
    </section>
    <section id="proficiency">
        <h2>Proficiencies</h2>
        <div class="proficiency-section weapon-proficiency">
            <h3>Weapons</h3>
            <ul>
                {#each weaponProficiencies as weaponProficiency, i}
                <li class="weapon-proficiency">
                    <input class="proficiency-input" type="text" placeholder="Name" bind:value= { weaponProficiency.name } on:input={ saveData } />
                    <input class="proficiency-input" type="number" placeholder="# of Slots" bind:value= { weaponProficiency.slots } on:input={ saveData } />
                    <input class="proficiency-input" type="text" placeholder="Source" bind:value= { weaponProficiency.source } on:input={ saveData } />
                    <button on:click={ () => removeProficiency(i, weaponProficiency.type) }>-</button>
                </li>
                {/each}
            </ul>
            <button on:click={ () => addProficiency('weapon') }>+</button>
        </div>
        <div class="proficiency-section non-weapon-proficiency">
            <h3>Non-Weapon</h3>
            <ul>
                {#each nonWeaponProficiencies as nonWeaponProficiency, i}
                <li class="non-weapon-proficiency">
                    <input class="proficiency-input" type="text" placeholder="Name" bind:value= { nonWeaponProficiency.name } on:input={ saveData } />
                    <input class="proficiency-input" type="number" placeholder="# of Slots" bind:value= { nonWeaponProficiency.slots } on:input={ saveData } />
                    <input class="proficiency-input" type="text" placeholder="Source" bind:value= { nonWeaponProficiency.source } on:input={ saveData } />
                    <button on:click={ () => removeProficiency(i, nonWeaponProficiency.type) }>-</button>
                </li>
                {/each}                
            </ul>
            <button on:click={ () => addProficiency('non-weapon') }>+</button>
        </div>
    </section>
    <section id="inventory">
        <h2>Inventory</h2>
        <span>Total Weight: { inventoryWeight }</span>
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

<style lang="scss">
    main{
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }
    #character-info{
        display: flex;
        gap: 20px;
    }
    .character-basics{
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }
    .character-background
    #attributes{
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        width: 150px;
    }
    .attributes-list{
        li{
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            input{
                width: 40px;
                text-align: center;
            }
        }        
    }
    .character-classes{
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    ul{
        list-style-type: none;
        padding: 0;
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