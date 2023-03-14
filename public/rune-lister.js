// Version 2.0.0

const prnt = console.log;
function ID(o) {
  return document.getElementById(o);
}


// Data file offsets
const VERSION_OFFSET = 4;
const CHAR_TYPE_OFFSET = 40;
const LEVEL_OFFSET = 43;
const STATS_OFFSET = 0x2fd;

const CHAR_TYPE_LIST = ['ama', 'sor', 'nec', 'pal', 'bar', 'dru', 'ass']

const FILE_VERSIONS = {
  'v71': '1.00 - 1.06',
  'v87': '1.07 or 1.08 exp',
  'v89': '1.08 std',
  'v92': '1.09',
  'v96': '1.10+',
  'v98': 'Resurrected',
}

function scaleAttributes(displayValues, down) {
  const multiplier = down ? 1 / 256 : 256;
  const tmp = displayValues
  // Health
  if (displayValues.maxHP) tmp.maxHP = displayValues.maxHP * multiplier
  if (displayValues.currentHP) tmp.currentHP = displayValues.currentHP * multiplier
  // Mana
  if (displayValues.maxMana) tmp.maxMana = displayValues.maxMana * multiplier
  if (displayValues.currentMana) tmp.currentMana = displayValues.currentMana * multiplier
  // Stamina
  if (displayValues.maxStamina) tmp.maxStamina = displayValues.maxStamina * multiplier
  if (displayValues.currentStamina) tmp.currentStamina = displayValues.currentStamina * multiplier

  return tmp
}


const ATTRIBUTES = [
  { id: 0, width: 10, name: 'strength', },
  { id: 1, width: 10, name: 'energy', },
  { id: 2, width: 10, name: 'dexterity', },
  { id: 3, width: 10, name: 'vitality', },
  { id: 4, width: 10, name: 'unusedStats', },
  { id: 5, width: 8, name: 'unusedSkills', },
  { id: 6, width: 21, name: 'currentHP', },
  { id: 7, width: 21, name: 'maxHP', },
  { id: 8, width: 21, name: 'currentMana', },
  { id: 9, width: 21, name: 'maxMana', },
  { id: 10, width: 21, name: 'currentStamina', },
  { id: 11, width: 21, name: 'maxStamina', },
  { id: 12, width: 7, name: 'level', },
  { id: 13, width: 32, name: 'experience', },
  { id: 14, width: 25, name: 'gold', },
  { id: 15, width: 25, name: 'stashedGold', },
]
// map attribute names to ids
const ATTRIBUTE_IDS = {}
for (var i = 0; i < ATTRIBUTES.length; i++) ATTRIBUTE_IDS[ATTRIBUTES[i].name] = ATTRIBUTES[i].id;
// prnt(ATTRIBUTE_IDS)


const RUNE_CODES = {
  'r01':'El',
  'r02':'Eld',
  'r03':'Tir',
  'r04':'Nef',
  'r05':'Eth',
  'r06':'Ith',
  'r07':'Tal',
  'r08':'Ral',
  'r09':'Ort',
  'r10':'Thul',
  'r11':'Amn',
  'r12':'Sol',
  'r13':'Shael',
  'r14':'Dol',
  'r15':'Hel',
  'r16':'Io',
  'r17':'Lum',
  'r18':'Ko',
  'r19':'Fal',
  'r20':'Lem',
  'r21':'Pul',
  'r22':'Um',
  'r23':'Mal',
  'r24':'Ist',
  'r25':'Gul',
  'r26':'Vex',
  'r27':'Ohm',
  'r28':'Lo',
  'r29':'Sur',
  'r30':'Ber',
  'r31':'Jah',
  'r32':'Cham',
  'r33':'Zod',
}


const DragDrop = {
  checkSupport: function () {
    // prettier-ignore
    return (window.File && window.FileReader && window.FileList && window.Blob)
  },

  // prettier-ignore
  add: function (divID, process) {
    const dropZone = ID(divID);
    const currentClass = dropZone.className
    if (currentClass.indexOf('droptarget') < 0) dropZone.className = currentClass + ' droptarget'
    dropZone.addEventListener("dragenter", DragDrop.onDragEnterLeave, false);
    dropZone.addEventListener("dragleave", DragDrop.onDragEnterLeave, false);
    dropZone.addEventListener("dragover", DragDrop.onDragOver, false);
    dropZone.addEventListener("drop", function (evt) { DragDrop.onDrop(evt, process) }, false);
  },
  readFileAndProcess: function (file, count, total, process) {
    const fr = new FileReader();
    fr.onload = function () {
      if (fr.result && typeof process === "function") {
        process(fr.result, file, count, total);
      }
    };
    fr.readAsArrayBuffer(file);
  },
  // prettier-ignore
  onDrop: function (evt, process) {
    evt.stopPropagation();
    evt.preventDefault();

    const files = evt.dataTransfer.files;
    if (files.length > 1) {
      alert('Can only process one file at a time')
      return
    }
    var output = [];
    for (var i = 0, f; (f = files[i]); i++) {
      DragDrop.readFileAndProcess(f, i + 1, files.length, process);
    }
    evt.target.className = evt.target.className.replace("dragover", "").trim();
  },
  // prettier-ignore
  onDragEnterLeave: function (evt) {
    const currentClass = evt.target.className;

    if (evt.type === "dragleave") {
      evt.target.className = currentClass.replace("dragover", "").trim();
    } else if (evt.type === "dragenter" && currentClass.indexOf("dragover") < 0) {
      evt.target.className = (currentClass + " dragover").trim();
    }
  },
  onDragOver: function (evt) {
    evt.preventDefault();
    evt.dataTransfer.dropEffect = "copy";
  }
};

function saveFileString(filename, data) {
  var blob = new Blob([data], { type: "data:application/octet-stream" });
  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveBlob(blob, filename);
  } else {
    var elem = window.document.createElement("a");
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
    window.URL.revokeObjectURL(elem.href);
  }
}

const D2CharEdit = {
  readString: function (buf, index, length) {
    return String.fromCharCode.apply(null, buf.slice(index, index + length))
  },
  isCharacterFile: function (buf) {
    if (buf.length < 1000) return false;

    // check headers
    const fileHeader = D2CharEdit.readString(buf, 0, 4);
    const questHeader = D2CharEdit.readString(buf, 335, 4);
    const waypointsHeader = D2CharEdit.readString(buf, 633, 2);

    return (
      fileHeader === "\x55\xaa\x55\xaa" &&
      questHeader === "Woo!" &&
      waypointsHeader === "WS"
    );
  },

  readByte: function (buf, index) {
    return buf[index];
  },

  writeByte: function (buf, index, value) {
    buf[index] = value & 0xff;
  },

  readWORD: function (buf, index) {
    const lowerByte = buf[index];
    const upperByte = buf[index + 1];
    return ((upperByte & 0xff) << 8)+ (lowerByte & 0xff);
  },

  writeWORD: function (buf, index, word) {
    const lowerByte = word & 0xff;
    const upperByte = word >> 8;
    buf[index] = lowerByte;
    buf[index + 1] = upperByte;
  },

  writeDWORD: function (buf, index, word) {
    D2CharEdit.writeWORD(buf, index, word & 0xffff);
    D2CharEdit.writeWORD(buf, index + 2, word >> 16);
  },

  writeString: function (buf, index, str) {
    for (var i = 0; i < str.length; i++) {
      buf[index + i] = str.charCodeAt(i);
    }
  },

  getFileVersion: function (buf) {
    const b1 = D2CharEdit.readByte(buf, VERSION_OFFSET);
    return `${b1} ${FILE_VERSIONS['v' + b1]}`;
  },

  // get the character type as a string
  getCharType: function (buf) {
    const charType = D2CharEdit.readByte(buf, CHAR_TYPE_OFFSET);
    return CHAR_TYPE_LIST[charType];
  },

  getHeaderLevel: function (buf) {
    return D2CharEdit.readByte(buf, LEVEL_OFFSET);
  },

  setHeaderLevel: function (buf, newLevel) {
    D2CharEdit.writeByte(buf, LEVEL_OFFSET, newLevel)
  },

  to8Bits: function (number) {
    const bits = "00000000".concat(number.toString(2)).slice(-8);
    return bits.split('').reverse().join('');

  },

  // Read reversed bits
  readRVBits: function (buf, offset, start, length, show) {
    const bytesToRead = Math.ceil(length / 8);
    const startBytes = Math.floor(start / 8);

    const arrayOfBytes = buf.slice(offset, offset + startBytes + bytesToRead);
    var bits = '';
    for (var i = 0; i < arrayOfBytes.length; i++) {
      const newBits = D2CharEdit.to8Bits(arrayOfBytes[i]);
      bits = bits.concat(newBits);
    }

    if (show) {
      return bits;
    };

    const requiredBits = bits.slice(start, start + length);
    const bitvalue = requiredBits.split('').reverse().join('');

    return parseInt(bitvalue, 2);
  },

  // Get current character statistics.  Return an object of values on success or string on error
  // Values are scaled down to display values
  getStats: function (buf) {
    const attributes = {};
    const header = D2CharEdit.readString(buf, STATS_OFFSET, 2);
    const dof = STATS_OFFSET + 2; // Data Offset

    if (header !== 'gf') return "Error: invalid stats header";

    let bstart = 0;
    let aID = D2CharEdit.readRVBits(buf, dof, bstart, 9);
    bstart += 9;
    let value = 0;
    let attribLen = 0;

    while (aID !== 0x1ff) {
      attribLen = ATTRIBUTES[aID].width;
      value = D2CharEdit.readRVBits(buf, dof, bstart, attribLen);
      bstart += attribLen;

      attributes[ATTRIBUTES[aID].name] = value;
      prnt(`GET  Attrib: ${aID} ${ATTRIBUTES[aID].name}: Value: ${value}`)

      aID = D2CharEdit.readRVBits(buf, dof, bstart, 9);
      bstart += 9;
    }

    // GLOBAL_BITS = D2CharEdit.readRVBits(buf, dof, bstart - 9, 9, true);

    return scaleAttributes(attributes, true);
  },

  // return a reversed bit string with specified width of the given value
  rvBits: function (value, width) {
    const valueBinary = '0'.repeat(width).concat(value.toString(2)).slice(-width)
    return valueBinary.split('').reverse().join('')
  },

  setStats: function (buf, currentValuesDisplay, newValuesDisplay) {
    var bitData = ''
    const newValues = scaleAttributes(newValuesDisplay);
    const currentValues = scaleAttributes(currentValuesDisplay);

    // loop through each value and build stats data bit string
    for (var aName of Object.keys(currentValues)) {
      const id = ATTRIBUTE_IDS[aName]
      bitData = bitData.concat(D2CharEdit.rvBits(id, 9))

      const value = (newValues && typeof (newValues[aName]) === 'number') ? newValues[aName] : currentValues[aName]
      prnt('SET(' +id + ') ' + aName + ': ' + value + ' = ' + D2CharEdit.rvBits(value, ATTRIBUTES[id].width));
      bitData = bitData.concat(D2CharEdit.rvBits(value, ATTRIBUTES[id].width))
    }

    bitData = bitData.concat(D2CharEdit.rvBits(0x1ff, 9))

    const dof = STATS_OFFSET + 2; // Data Offset
    const dataBytes = Math.floor(bitData.length / 8)
    var remainingBits = bitData
    for (var i = 0; i < dataBytes; i++) {
      buf[dof + i] = parseInt(remainingBits.slice(0, 8).split('').reverse().join(''), 2)
      remainingBits = remainingBits.slice(8)
    }
  },

  showStats: function (buf) {
    const attribOrError = D2CharEdit.getStats(buf);
    if (typeof (attribOrError) !== 'object') return prnt(attribOrError);
    const characterAttributes = attribOrError

    prnt(JSON.stringify(characterAttributes, null, 2))
  },


  getItemLocation: function(byte) {
    const bitmask = parseInt('00001110', 2);
    const bitvalue = parseInt(this.rvBits(byte, 8), 2);
    const value = (byte & bitmask) >> 1;
    const locations = [ 'equip/belt', 'inventory', 'unknown1', 'unknown2', 'cube', 'stash', 'unknown3'];
    // 1 = inventory
    // 4 = cube
    // 5 = stash
    return locations[value];
  },
  itemCode: function(buf, index) {
    b1 = D2CharEdit.readByte(buf, index+9);
    b2 = D2CharEdit.readByte(buf, index+10);
    b3 = D2CharEdit.readByte(buf, index+11);
    b4 = D2CharEdit.readByte(buf, index+12);
    b5 = D2CharEdit.readByte(buf, index+13);

    bitString = D2CharEdit.to8Bits(b1).slice(-4) + D2CharEdit.to8Bits(b2) + D2CharEdit.to8Bits(b3) + D2CharEdit.to8Bits(b4) + D2CharEdit.to8Bits(b5).slice(0,4)

    c1 = String.fromCharCode( parseInt(bitString.slice(0,8).split('').reverse().join(''), 2) )
    c2 = String.fromCharCode( parseInt(bitString.slice(8,16).split('').reverse().join(''), 2) )
    c3 = String.fromCharCode( parseInt(bitString.slice(16,24).split('').reverse().join(''), 2) )

    return `${c1}${c2}${c3}`
  },
  listRunes: function (buf) {
    const runelist = {}
    var count = 0
    var index = STATS_OFFSET + 2;
    var bytepair = D2CharEdit.readString(buf, index, 2);

    while (index+1 < buf.length) {
      index++;
      bytepair = D2CharEdit.readString(buf, index, 2);
      if (bytepair == 'JM') {
        if (count === 0) {
          prnt('item count: ', D2CharEdit.readWORD(buf, index+2));
          count++;
        } else {
          const locationByte = D2CharEdit.readByte(buf, index+9);
          if (locationByte) {
            const itemCode = D2CharEdit.itemCode(buf,index);
            if (RUNE_CODES[itemCode] !== undefined) runelist[RUNE_CODES[itemCode]] = 1;
            prnt('Location: ', D2CharEdit.getItemLocation(locationByte), '  TypeCode:', itemCode)
          }
        }
      }
    }
    prnt('Stopped: ', index);

    return Object.keys(runelist);
  },

  setRunes: function(runelist) {
    const data = {
      pinnedRunewords:[],
      selectedRunes: runelist
    }
    localStorage.setItem('runewizard', JSON.stringify(data));
    location.reload()
  }
};


function processFile(buf, file, count, total) {
  const fileUI8 = new Uint8Array(buf);

  if (D2CharEdit.isCharacterFile(fileUI8)) {
    // const fileVersion = D2CharEdit.getFileVersion(fileUI8);
    // prnt('File version: ' + fileVersion);

    // const charType = D2CharEdit.getCharType(fileUI8);
    // prnt(`Character type: ${charType}`);

    // prnt('Old character stats')
    // D2CharEdit.showStats(fileUI8)

    const runelist = D2CharEdit.listRunes(fileUI8)
    D2CharEdit.setRunes(runelist)
  } else {
    alert("This file is not a Diablo 2 character file that I can handle");
  }
}

function insertDropArea() {
  const style = document.createElement('style');
  const cssText = '#droparea01.dragover { background-color: orange }\n' +
  '#droparea01 { height: 64px; border: 5px solid orange; display: flex; justify-content: center; align-items: center }\n'
  
  document.head.appendChild(style);
  style.appendChild(document.createTextNode(cssText))
  
  const dropArea = document.createElement("div")
  dropArea.id = 'droparea01'

  dropArea.innerHTML = "Drag and Drop your character .d2s file here to automatically select runes below"

  const target = document.querySelector('div.mr-16 > div.relative')
  document.body.prepend(dropArea);
}

if (DragDrop.checkSupport()) {
  insertDropArea();
  DragDrop.add("droparea01", processFile);
} else {
  alert("The File APIs are not fully supported in this browser.");
}

prnt("Ready!");
