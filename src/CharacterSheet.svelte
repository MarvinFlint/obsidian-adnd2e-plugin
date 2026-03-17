<script lang="ts">
    import type { TFile, Vault, MarkdownView, Editor } from 'obsidian';
    import { type Item, type Equipment, type FieldType, type FieldSchema, ITEM_FIELDS, type EquipmentSlot } from './types'
    import { EQUIPMENT_SLOTS, AVAILABLE_CLASSES, SPELL_LEVELS } from './types';
    import { type Proficiency, type ProficiencyType } from './types';
    import { type SpellSlots } from './types';

    export let fileData: Record<string, any> = {};
    export let activeFile: TFile | null = null;
    export let vault: Vault;
    export let containerEl: HTMLElement;

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
        { name: 'Wisdom', value: 10, abbr: 'WIS' },
        { name: 'Intelligence', value: 10, abbr: 'INT' },
        { name: 'Charisma', value: 10, abbr: 'CHA' },
    ];

    let maxHealthPoints: number = fileData.maxHealthPoints ?? 0;
    let currentHealthPoints: number = fileData.currentHealthPoints ?? 0;
    let calculateArmorClassAutomatically: boolean = fileData.calculateArmorClassAutomatically ?? false;
    
    let weaponProficiencies: Array<Proficiency> = fileData.weaponProficiencies ?? [];
    let nonWeaponProficiencies: Array<Proficiency> = fileData.nonWeaponProficiencies ?? [];

    let inventory: Array<Item> = fileData.inventory ?? [];
    let equipment: Equipment = fileData.equipment ?? {};

    $: inventoryWeight = inventory.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
    $: totalWeight = inventoryWeight + characterWeight;

    $: equippedItems = EQUIPMENT_SLOTS.map(slot => ({
        slot,
        item: inventory.find(i => i.id === equipment[slot]) ?? null
    }));

    let manualArmorClass = fileData.manualArmorClass ?? 10;
    $: armorClass = calculateArmorClassAutomatically ? calculateArmorClass(equippedItems, attributes) : manualArmorClass;

    let spellSlots: SpellSlots = fileData.spellSlots ?? [];

    async function saveData(){
        clearTimeout(saveTimeout);
        saveTimeout = window.setTimeout(async () => {
            if (!activeFile) return;
            const classesToSave = characterClasses.filter(c => c.className.trim() !== '');
            await vault.modify(activeFile, JSON.stringify({ 
                characterName, 
                characterBackground,
                characterWeight,
                characterAge,
                attributes,
                maxHealthPoints,
                currentHealthPoints,
                armorClass,
                manualArmorClass,
                calculateArmorClassAutomatically,
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
        const viewContainer = containerEl.querySelector('.view-content');
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

    function removeItem(index: number){
        inventory = inventory.filter((_,i) => i !== index);
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

    function calculateArmorClass(equipped: typeof equippedItems, attrs: typeof attributes):string{
        const base = 10;
        const dexBonus = Math.floor((attrs[1].value - 10) / 2);
        const armorClassFromItems = equipped.filter((slot, i) => slot.slot !== 'main_hand').reduce((totalItemAc, { item }) => { return totalItemAc + (item ? (Number(item.armorClass) || 0) + (Number(item.magicBonus) || 0) : 0)}, 0)
        const totalArmorClass:number = base + dexBonus + armorClassFromItems;
        return String(totalArmorClass);
    }

    function addSpell(level: number) {
        const current = spellSlots[level] ?? [];
        spellSlots = { ...spellSlots, [level]: [...current, { spellName: '', used: false }] };
        saveData();
    }

    function removeSpell(level: number, index: number) {
        spellSlots = { 
            ...spellSlots, 
            [level]: (spellSlots[level] ?? []).filter((_, i) => i !== index) 
        };
        saveData();
    }
</script>

<main class="sheet" lang="en">
    <header class="sheet-header">
        <input class="name-input" type="text" placeholder="Character Name" bind:value={ characterName } on:input={ saveData } />
        <div class="header-meta">
            <div class="meta-pair">
                <span class="meta-label">Age</span>
                <input class="meta-input" type="number" bind:value={ characterAge } on:input={ saveData } />
            </div>
            <div class="meta-pair">
                <span class="meta-label">Weight</span>
                <input class="meta-input" type="number" bind:value={ characterWeight } on:input={ saveData } />
            </div>
            <div class="meta-pair">
                <span class="meta-label">Total</span>
                <span class="meta-value">{ totalWeight } lbs</span>
            </div>
            <div class="classes-inline">
                { #each characterClasses as characterClass, i }
                <div class="class-tag">
                    <select bind:value={characterClass.className} on:change={ saveData }>
                        { #each AVAILABLE_CLASSES as availableClass }
                        <option value={ availableClass }>{ availableClass }</option>
                        { /each }
                    </select>
                    <input class="level-input" type="number" bind:value={ characterClass.classLevel } on:input={ saveData } />
                    <button class="btn-remove" on:click={ () => removeCharacterClass(i) }>×</button>
                </div>
                { /each }
                <button class="btn-add-inline" on:click={addCharacterClass}>+ Class</button>
            </div>
        </div>
    </header>
    <div class="sheet-body">
        <div class="col-left">
            <section class="panel">
                <h3 class="panel-title">Attributes</h3>
                <div class="attr-grid">
                    { #each attributes as attribute }
                    <div class="attr-block">
                        <span class="attr-abbr">{ attribute.abbr }</span>
                        <input class="attr-input" type="number" bind:value={ attribute.value } on:input={ saveData } />
                    </div>
                    { /each }
                </div>
            </section>
            <section class="panel">
                <h3 class="panel-title">Stats</h3>
                <div class="stat-block">
                    <span class="stat-abbr">HP</span>
                    <input class="current-hp-input" type="number" bind:value={ currentHealthPoints } on:input={ saveData } />
                    /
                    <input class="max-hp-input" type="number" bind:value={ maxHealthPoints } on:input={ saveData } />
                </div>
                <div class="stat-block">  
                    <span class="stat-abbr">AC</span>             
                    { #if calculateArmorClassAutomatically }
                    <input class="armor-class-input" disabled type="number" placeholder="{ armorClass }" />
                    { :else }
                    <input class="armor-class-input" type="number" placeholder="Armor Class" bind:value={ manualArmorClass } on:input={ saveData }/>
                    { /if }
                </div> 
                <span class="auto-calc">Auto-calculate AC?<input type="checkbox" bind:checked={ calculateArmorClassAutomatically } on:change={ saveData } /></span>
            </section>
            <section class="panel">
                <h3 class="panel-title">Equipment</h3>
                <div class="equipment-list">
                    { #each equippedItems as { slot, item } }
                    <div class="slot-row">
                        <span class="slot-label">{ slot.replace('_', ' ') }</span>
                        { #if item }
                        <span class="slot-item-name">{ item.name }</span>
                        <button class="btn-unequip" on:click={ () => unequipItem(item) }>−</button>
                        { :else }
                        <span class="slot-empty">—</span>
                        { /if }
                    </div>
                    { /each }
                </div>
            </section>
        </div>
        <div class="col-right">
            <section class="panel">
                <h3 class="panel-title">Proficiencies</h3>
                <div class="prof-columns">
                    <div class="prof-group">
                        <div class="prof-group-header">
                            <span class="prof-group-label">Weapon</span>
                            <button class="btn-add-inline" on:click={ () => addProficiency('weapon') }>+</button>
                        </div>
                        { #each weaponProficiencies as prof, i }
                        <div class="prof-row">
                            <input class="prof-name" type="text" placeholder="Name" bind:value={ prof.name } on:input={ saveData } />
                            <input class="prof-slots" type="number" placeholder="Slots" bind:value={ prof.slots } on:input={ saveData } />
                            <input class="prof-source" type="text" placeholder="Source" bind:value={ prof.source } on:input={ saveData } />
                            <button class="btn-remove" on:click={ () => removeProficiency(i, prof.type) }>×</button>
                        </div>
                        { /each }
                    </div>
                    <div class="prof-group">
                        <div class="prof-group-header">
                            <span class="prof-group-label">Non-Weapon</span>
                            <button class="btn-add-inline" on:click={ () => addProficiency('non-weapon') }>+</button>
                        </div>
                        { #each nonWeaponProficiencies as prof, i }
                        <div class="prof-row">
                            <input class="prof-name" type="text" placeholder="Name" bind:value={ prof.name } on:input={ saveData } />
                            <input class="prof-slots" type="number" placeholder="Slots" bind:value={ prof.slots } on:input={ saveData } />
                            <input class="prof-source" type="text" placeholder="Source" bind:value={ prof.source } on:input={ saveData } />
                            <button class="btn-remove" on:click={ () => removeProficiency(i, prof.type) }>×</button>
                        </div>
                        { /each }
                    </div>
                </div>
            </section>
            <section class="panel">
                <div class="panel-title-row">
                    <h3 class="panel-title">Inventory</h3>
                    <span class="weight-badge">{ inventoryWeight } lbs</span>
                    <button class="btn-add-inline" on:click={ openAddItemPanel }>+ Item</button>
                </div>
                <div class="inventory-header-row">
                    <span>Name</span>
                    <span>Wt</span>
                    <span>Qty</span>
                    <span>Description</span>
                    <span>Equip</span>
                </div>
                { #each inventory as item, i }
                <div class="inventory-row">
                    <input type="text" placeholder="Name" bind:value={ item.name } on:input={ saveData } />
                    <input type="number" placeholder="0" bind:value={ item.weight } on:input={ saveData } />
                    <input type="number" placeholder="1" bind:value={ item.quantity } on:input={ saveData } />
                    <input type="text" placeholder="—" bind:value={ item.description } on:input={ saveData } />
                    { #if item.equippable }
                    <input type="checkbox" checked={ item.equipped } on:change={ () => item.equipped ? unequipItem(item) : equipItem(item) } />
                    <button class="btn-expand" on:click={ () => { item.expanded = !item.expanded; inventory = [...inventory]; } }>
                        <span class:expanded={ item.expanded }>▾</span>
                    </button>
                    { :else }
                    <span></span>
                    <span></span>
                    { /if }                    
                    <button class="btn-remove" on:click={ () => removeItem(i) }>×</button>
                </div>
                { #if item.expanded }
                <div class="inventory-detail-row">
                    <span class="detail-label">AC</span>
                    <input type="number" placeholder="—" bind:value={ item.armorClass } on:input={ saveData } />
                    <span class="detail-label">Magic Bonus</span>
                    <input type="number" placeholder="—" bind:value={ item.magicBonus } on:input={ saveData } />
                    <span class="detail-label">Slot</span>
                    <select bind:value={item.slot} on:change={ saveData }>
                        { #each ['none', ...EQUIPMENT_SLOTS] as slot }
                        <option value={ slot === 'none' ? null : slot }>{ slot.replace('_', ' ') }</option>
                        { /each }
                    </select>
                </div>
                { /if }
                { /each }
            </section>
            <section class="panel">
                <h3 class="panel-title">Background</h3>
                <textarea class="background-area" bind:value={ characterBackground } on:input={ saveData } placeholder="Character history, notes, personality..."></textarea>
            </section>
            <section class="panel">
                <h3 class="panel-title">Spellslots</h3>
                <div class="spellslot-rows">
                    { #each SPELL_LEVELS as level }
                    <div class="spellslot-row">
                        <div class="spellslot-row-header">
                            <span>Level { level }</span>                            
                        </div>
                        <div class="spellslot-row-content">
                            { #each (spellSlots[level] ?? []) as spell, i }
                            <div class="spellslot-entry">
                                <input type="text" placeholder="Spell name" bind:value={ spell.spellName } on:input={ saveData } />
                                <input type="checkbox" bind:checked={ spell.used } on:change={ saveData } />
                                <button class="btn-remove" on:click={ () => removeSpell(level, i) }>×</button>
                            </div>
                            { /each }
                            <button class="btn-add-inline" on:click={ () => addSpell(level) }>+</button>
                        </div>                        
                    </div>
                    { /each }
                </div>
            </section>
        </div>
    </div>
</main>


<style>
    .sheet {
        font-family: var(--font-interface);
        font-size: var(--font-ui-small);
        color: var(--text-normal);
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 960px;
    }

    input, select, textarea {
        background: transparent;
        border: none;
        border-bottom: 1px solid var(--background-modifier-border);
        color: var(--text-normal);
        font-family: var(--font-interface);
        font-size: var(--font-ui-small);
        padding: 2px 4px;
        outline: none;
        width: 100%;
    }
    select option{
        background: var(--background-primary);
        color: var(--text-normal);
    }
    input:focus, select:focus, textarea:focus {
        border-bottom-color: var(--interactive-accent);
    }
    input[type="checkbox"], :global(#item-field-equippable) {
        width: auto;
        min-width: auto;
        height: auto;
        border: none;
        border-bottom: none;
        cursor: pointer;
        appearance: auto;
        -webkit-appearance: auto;
        flex-shrink: 0;
        justify-self: flex-start;
    }
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
    }
    .sheet-header {
        border-bottom: 2px solid var(--interactive-accent);
        padding-bottom: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .name-input {
        font-size: var(--font-ui-larger);
        font-weight: var(--font-semibold);
        border-bottom: none;
        padding: 0;
    }
    .name-input::placeholder {
        color: var(--text-faint);
    }
    .header-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 16px;
    }
    .meta-pair {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .meta-label {
        color: var(--text-muted);
        font-size: var(--font-ui-smaller);
        white-space: nowrap;
    }
    .meta-input {
        width: 48px;
    }
    .meta-value {
        color: var(--text-accent);
        font-weight: var(--font-semibold);
    }
    .classes-inline {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
        margin-left: auto;
    }
    .class-tag {
        display: flex;
        align-items: center;
        gap: 4px;
        background: var(--background-secondary);
        border: 1px solid var(--background-modifier-border);
        border-radius: var(--radius-s);
        padding: 2px 6px;
    }
    .class-tag select {
        border: none;
        width: auto;
    }
    .level-input {
        width: 32px;
        text-align: center;
        font-weight: var(--font-semibold);
    }

    .sheet-body {
        display: grid;
        grid-template-columns: 180px 1fr;
        gap: 12px;
        align-items: start;
    }
    .panel {
        border: 1px solid var(--background-modifier-border);
        border-radius: var(--radius-m);
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
    }
    .panel-title {
        font-size: var(--font-ui-smaller);
        font-weight: var(--font-semibold);
        color: var(--text-muted);
        margin: 0 0 4px 0;
        border-bottom: 1px solid var(--background-modifier-border);
        padding-bottom: 4px;
    }
    .panel-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 1px solid var(--background-modifier-border);
        padding-bottom: 4px;
        margin-bottom: 4px;
    }
    .panel-title-row .panel-title {
        border: none;
        padding: 0;
        margin: 0;
    }
    .weight-badge {
        font-size: var(--font-ui-smaller);
        color: var(--text-accent);
        margin-right: auto;
    }

    .attr-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
    }
    .attr-block, .stat-block {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .attr-abbr {
        font-size: var(--font-ui-smaller);
        font-weight: var(--font-semibold);
        color: var(--text-muted);
        width: 28px;
        flex-shrink: 0;
    }
    .attr-input {
        width: 40px;
        text-align: center;
        font-weight: var(--font-semibold);
        font-size: var(--font-ui-medium);
    }
    .auto-calc{
        display: flex;
        gap: 5px;
    }   
    .equipment-list {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }
    .slot-row {
        display: grid;
        grid-template-columns: 72px 1fr auto;
        align-items: center;
        gap: 6px;
        min-height: 20px;
    }
    .slot-label {
        font-size: var(--font-ui-smaller);
        color: var(--text-muted);
    }
    .slot-item-name {
        color: var(--text-normal);
        overflow-wrap: break-word;
    }
    .slot-empty {
        color: var(--text-faint);
    }

    .prof-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }
    .prof-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .prof-group-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 2px;
    }
    .prof-group-label {
        font-size: var(--font-ui-smaller);
        font-weight: var(--font-semibold);
        color: var(--text-muted);
    }
    .prof-row {
        display: grid;
        grid-template-columns: 1fr 36px 64px auto;
        gap: 4px;
        align-items: center;
    }
    .prof-slots {
        text-align: center;
    }

    .inventory-header-row {
        display: grid;
        grid-template-columns: 1fr 44px 44px 1fr 20px 18px 20px;
        gap: 4px;
        font-size: var(--font-ui-smaller);
        color: var(--text-faint);
        padding: 0 4px;
    }
    .inventory-row {
        display: grid;
        grid-template-columns: 1fr 44px 44px 1fr 20px 18px 20px;
        gap: 4px;
        align-items: center;
        border-bottom: 1px solid var(--background-modifier-border-hover);
        padding: 2px 4px;
    }
    .inventory-row:last-child {
        border-bottom: none;
    }

    .btn-expand {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0 4px;
        font-size: var(--font-ui-medium);
        width: auto;
        transition: transform 0.15s ease;
        display: inline-block;
    }
    .btn-expand span {
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        transition: transform 0.15s ease;
    }
    .btn-expand span.expanded {
        transform: rotate(180deg);
    }
    .btn-expand:hover {
        color: var(--text-normal);
    }
    .inventory-detail-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 4px 8px 6px 8px;
        background: var(--background-secondary);
        border-bottom: 1px solid var(--background-modifier-border);
        font-size: var(--font-ui-smaller);
    }
    .inventory-detail-row input,
    .inventory-detail-row select {
        width: 80px;
        border-bottom: 1px solid var(--background-modifier-border);
    }
    .detail-label {
        color: var(--text-muted);
        font-size: var(--font-ui-smaller);
        white-space: nowrap;
    }

    .background-area {
        resize: vertical;
        min-height: 80px;
        border: none;
        border-bottom: none;
        font-size: var(--font-ui-small);
        line-height: var(--line-height-normal);
        width: 100%;
        padding: 4px;
    }

    .btn-remove {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0 4px;
        font-size: var(--font-ui-medium);
        line-height: 1;
        width: auto;
    }
    .btn-remove:hover {
        color: var(--text-error);
    }
    .btn-add-inline {
        background: none;
        border: 1px solid var(--background-modifier-border);
        border-radius: var(--radius-s);
        color: var(--text-muted);
        cursor: pointer;
        padding: 2px 8px;
        font-family: var(--font-interface);
        font-size: var(--font-ui-smaller);
        white-space: nowrap;
        width: auto;
    }
    .btn-add-inline:hover {
        border-color: var(--interactive-accent);
        color: var(--interactive-accent);
    }
    .btn-unequip {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0 4px;
        font-size: var(--font-ui-medium);
        width: auto;
    }
    .btn-unequip:hover {
        color: var(--text-error);
    }

    .spellslot-rows {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .spellslot-row {
        display: flex;
        gap: 4px;
    }
    .spellslot-row-header {
        display: flex;
        min-width: 80px;
        width:80px;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--background-modifier-border);
        padding-bottom: 4px;
        margin-bottom: 2px;
    }
    .spellslot-row-header span {
        font-size: var(--font-ui-smaller);
        font-weight: var(--font-semibold);
        color: var(--text-muted);
    }
    .spellslot-row-content{
        display: flex;
        flex-wrap: wrap;
    }
    
    .spellslot-entry {
        display: flex;
        align-items: center;
        gap: 4px;
    }
    .spellslot-entry input[type="text"] {
        min-width: 0;
    }

    :global(.add-item-wrapper){
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: var(--radius-m);
        padding: 20px;
        width: 60%;
        min-width: 400px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        font-family: var(--font-interface);
        font-size: var(--font-ui-small);
        z-index: 100;
        box-shadow: var(--shadow-l);
    }
    :global(.add-item-wrapper .item-inputs){
        display: grid;
        grid-template-columns: 120px 1fr;
        align-items: center;
        gap: 6px 12px;
    }
    :global(.item-input-row){
        display: contents;
    }
    :global(.add-item-wrapper label){
        font-size: var(--font-ui-smaller);
        color: var(--text-muted);
    }
    :global(.add-item-wrapper input),
    :global(.add-item-wrapper select){
        background: transparent;
        border: none;
        border-bottom: 1px solid var(--background-modifier-border);
        color: var(--text-normal);
        font-family: var(--font-interface);
        font-size: var(--font-ui-small);
        padding: 2px 4px;
        outline: none;
        width: 100%;
    }
    :global(.create-item-buttons){
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-top: 4px;
    }
    :global(.create-item-buttons button){
        flex: 1;
        padding: 6px 12px;
        border: 1px solid var(--background-modifier-border);
        border-radius: var(--radius-s);
        background: transparent;
        color: var(--text-normal);
        font-family: var(--font-interface);
        font-size: var(--font-ui-small);
        cursor: pointer;
    }
    :global(.create-item-buttons .accept-button){
        border-color: var(--interactive-accent);
        color: var(--interactive-accent);
    }
    :global(.create-item-buttons .accept-button:hover){
        background: var(--interactive-accent);
        color: var(--on-accent);
    }
    :global(.create-item-buttons .cancel-button:hover){
        background: var(--background-modifier-hover);
    }
</style>