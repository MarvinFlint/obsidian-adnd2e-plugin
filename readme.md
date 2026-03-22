# DnD 2e Character Sheet

A functional 2e 0,character sheet view plugin for the text editor Obsidian.
<img src="/img/overview.png" width="600" height="auto" alt="Depiction of a regular view" />

## Fields
Available fields are:

### Characteristics
- Name (String)
- Age (Number)
- Weight (Number)
- Height (Number)

### Info
- Classes (Dropdown selection)
- Attributes (Number)
- Max and Current HP (Number)
- AC (Number)
- Proficiencies (String)
- Background (String)

### Inventory
Items can be added in an extra dialog window
<img src="/img/add_item.png" width="400" height="auto" alt="Dialog window to add an item" />
where every attribute can be set and whether the item is equippable or not. <b>This can only be set upon item creation and not be modified afterwards</b>. All other attributes can be altered afterwards.
Available fields for items are  

- Name (String)
- Weight (Number)
- Quantity (Number)
- Description (String)
- Equipped (Boolean)

In the extended fields accessible via the downwards-button at the end of a row <b>for equippable items only</b> there are also
- AC (Number)
- Magic Bonus (Number)
- Slot (Dropdown selection)

A checkbox denotes whether an item is equipped.

### Equipment
Items marked as <b>equippable</b> can be assigned to a slot which will show up here if checked in the inventory panel. If an item gets equipped if another is already present in that slot, the new one will replace the old one.

### Spellslots
Each row represents one spelllevel in which any number of slots can be added. A slot can be
- named (String)
- marked as used (Boolean)

### Automation
Inventory weight and total weight will be calculated automatically based on character weight and items in the inventory.

Armor Class can be set to be calculated automatically, in which case dex bonus, equipped items and their magic bonus (except main-hand) will be used. It can still be set manually in case this is not accurate for a given situation.

# License
Feel free to use and augment this code to your liking, a little credit would be nice though. If you want, roll a die and base it off of that.