export const EQUIPMENT_SLOTS = [
    'head',
    'neck',
    'body',
    'back',
    'gloves',
    'off_hand',
    'main_hand',
    'feet',
    'ring_left',
    'ring_right',
] as const;

export type EquipmentSlot = typeof EQUIPMENT_SLOTS[number];
export type Equipment = Partial<Record<EquipmentSlot, string>>;

export interface Item{
    id: string,
    name: string,
    description: string,
    weight: number,
    quantity: number,
    equipped: boolean,
    equippable: boolean,
    slot: EquipmentSlot | null,
    armorClass: number | null
    magicBonus: number | null
}

export type FieldType = 'text' | 'number' | 'checkbox' | 'select';

export interface FieldSchema {
    key: keyof Item;
    label: string;
    type: FieldType;
    options?: string[];
}

export const ITEM_FIELDS: FieldSchema[] = [
    { key: 'name',        label: 'Name',        type: 'text'     },
    { key: 'description', label: 'Description', type: 'text'     },
    { key: 'weight',      label: 'Weight',      type: 'number'   },
    { key: 'quantity',    label: 'Quantity',    type: 'number'   },
    { key: 'equippable',  label: 'Equippable',  type: 'checkbox' },
    { key: 'slot', label: 'Slot', type: 'select', options: ['none', ...EQUIPMENT_SLOTS] },
    { key: 'armorClass', label: 'Armor Class', type: 'number'},
    { key: 'magicBonus', label: 'Magic Bonus', type: 'number'}
];

export type ProficiencyType = 'non-weapon' | 'weapon';

export interface Proficiency {
    name: string,
    type: ProficiencyType,
    slots: number
    source: string | null
}

export const AVAILABLE_CLASSES: string[] = [    
    'Fighter',
    'Ranger',
    'Cleric',
    'Thief',
    'Wizard',
    'Druid',
    'Paladin'
]