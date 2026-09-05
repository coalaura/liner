import "../css/liner.css";

import MP3Tag from "mp3tag.js";

const $ = (id) => document.getElementById(id);

const ui = {
	form: $("editor-form"),
	controls: $("controls"),
	fileInput: $("mp3-input"),
	artInput: $("art-input"),
	empty: $("empty-state"),
	workspace: $("workspace"),
	fileName: $("file-name"),
	fileDetails: $("file-details"),
	editState: $("edit-state"),
	fields: $("tag-fields"),
	picker: $("tag-picker"),
	addTag: $("add-tag-button"),
	covers: $("covers"),
	artZone: $("art-zone"),
	advanced: $("advanced"),
	advancedCount: $("advanced-count"),
	rawFields: $("raw-fields"),
	fieldCount: $("field-count"),
	reset: $("reset-button"),
	status: $("status"),
};

const MAX_TAG_BYTES = 16 * 1024 * 1024;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 24_000_000;
const MAX_FRAMES = 512;
const MULTI_VALUE_SEPARATOR = "\\\\";

const GENRES = (
	"Blues|Classic Rock|Country|Dance|Disco|Funk|Grunge|Hip-Hop|Jazz|Metal|" +
	"New Age|Oldies|Other|Pop|R&B|Rap|Reggae|Rock|Techno|Industrial|" +
	"Alternative|Ska|Death Metal|Pranks|Soundtrack|Euro-Techno|Ambient|" +
	"Trip-Hop|Vocal|Jazz+Funk|Fusion|Trance|Classical|Instrumental|Acid|" +
	"House|Game|Sound Clip|Gospel|Noise|Alt. Rock|Bass|Soul|Punk|Space|" +
	"Meditative|Instrumental Pop|Instrumental Rock|Ethnic|Gothic|Darkwave|" +
	"Techno-Industrial|Electronic|Pop-Folk|Eurodance|Dream|Southern Rock|" +
	"Comedy|Cult|Gangsta Rap|Top 40|Christian Rap|Pop/Funk|Jungle|" +
	"Native American|Cabaret|New Wave|Psychedelic|Rave|Showtunes|Trailer|" +
	"Lo-Fi|Tribal|Acid Punk|Acid Jazz|Polka|Retro|Musical|Rock & Roll|" +
	"Hard Rock|Folk|Folk-Rock|National Folk|Swing|Fast-Fusion|Bebop|Latin|" +
	"Revival|Celtic|Bluegrass|Avantgarde|Gothic Rock|Progressive Rock|" +
	"Psychedelic Rock|Symphonic Rock|Slow Rock|Big Band|Chorus|" +
	"Easy Listening|Acoustic|Humour|Speech|Chanson|Opera|Chamber Music|" +
	"Sonata|Symphony|Booty Bass|Primus|Porn Groove|Satire|Slow Jam|Club|" +
	"Tango|Samba|Folklore|Ballad|Power Ballad|Rhythmic Soul|Freestyle|" +
	"Duet|Punk Rock|Drum Solo|A Cappella|Euro-House|Dance Hall|Goa|" +
	"Drum & Bass|Club-House|Hardcore|Terror|Indie|BritPop|Afro-Punk|" +
	"Polsk Punk|Beat|Christian Gangsta Rap|Heavy Metal|Black Metal|" +
	"Crossover|Contemporary Christian|Christian Rock|Merengue|Salsa|" +
	"Thrash Metal|Anime|JPop|Synthpop"
).split("|");

const GENRE_CHOICES = [...new Set([
	...GENRES,
	"Afrobeats", "Alternative Rock", "Art Pop", "Chillout", "Downtempo",
	"Dream Pop", "Dub", "Dubstep", "Experimental", "Garage", "Hyperpop",
	"IDM", "Indie Pop", "Indie Rock", "K-Pop", "Neo-Soul", "Podcast",
	"Post-Punk", "Post-Rock", "Shoegaze", "Synthwave", "World",
])].sort((a, b) => a.localeCompare(b));

const PICTURE_TYPES = [
	"Other", "File icon (32 × 32 PNG)", "Other file icon",
	"Front cover", "Back cover", "Leaflet", "Media",
	"Lead artist", "Artist", "Conductor", "Band / orchestra",
	"Composer", "Lyricist", "Recording location", "During recording",
	"During performance", "Video capture", "A bright coloured fish",
	"Illustration", "Artist logo", "Publisher logo",
];

const TAGS = [
	["TIT2", "Title", "text"],
	["TPE1", "Artist", "text"],
	["TALB", "Album", "text"],
	["TPE2", "Album artist", "text"],
	["TYER", "Year", "year", [3]],
	["TDRC", "Year / recording date", "timestamp", [4]],
	["TRCK", "Track", "position"],
	["TPOS", "Disc", "position"],
	["TCON", "Genre", "genre"],
	["TCOM", "Composer", "text"],
	["TEXT", "Lyricist", "text"],
	["TPE3", "Conductor", "text"],
	["TPE4", "Remixer", "text"],
	["TPUB", "Publisher", "text"],
	["TCOP", "Copyright", "text"],
	["TIT1", "Grouping", "text"],
	["TIT3", "Subtitle", "text"],
	["TBPM", "BPM", "integer"],
	["TKEY", "Musical key", "key"],
	["TSRC", "ISRC", "isrc"],
	["TLAN", "Language", "language"],
	["TMOO", "Mood", "text", [4]],
	["TDRL", "Release date", "timestamp", [4]],
	["TDOR", "Original release date", "timestamp", [4]],
	["TORY", "Original release year", "year", [3]],
	["TOAL", "Original album", "text"],
	["TOPE", "Original artist", "text"],
	["TENC", "Encoded by", "text"],
	["TSSE", "Encoding software", "text"],
	["TSOA", "Album sort order", "text", [4]],
	["TSOP", "Artist sort order", "text", [4]],
	["TSOT", "Title sort order", "text", [4]],
	["TSOC", "Composer sort order", "text", [4]],
	["TSO2", "Album artist sort order", "text"],
	["TCMP", "Compilation", "boolean"],
	["WOAR", "Artist website", "url"],
	["WOAF", "Track website", "url"],
	["WOAS", "Source website", "url"],
	["WPUB", "Publisher website", "url"],
	["WCOP", "Copyright URL", "url"],
	["COMM", "Comments", "records"],
	["USLT", "Lyrics", "records"],
	["TXXX", "Custom text", "records"],
	["WXXX", "Custom links", "records"],
	["POPM", "Rating / play count", "records"],
	["PCNT", "Play count", "integer"],
	["APIC", "Artwork", "art"],
].map(([id, label, kind, versions = [3, 4]]) => ({
	id, label, kind, versions,
}));

const DEFINITIONS = new Map(TAGS.map((tag) => [tag.id, tag]));

const RECORD_FIELDS = {
	COMM: [
		["language", "Language · ISO 639-2", "language", "eng"],
		["descriptor", "Description", "text", ""],
		["text", "Comment", "textarea", ""],
	],
	USLT: [
		["language", "Language · ISO 639-2", "language", "eng"],
		["descriptor", "Description", "text", ""],
		["text", "Lyrics", "textarea", ""],
	],
	TXXX: [
		["description", "Name", "text", ""],
		["text", "Value", "text", ""],
	],
	WXXX: [
		["description", "Description", "text", ""],
		["url", "URL", "url", ""],
	],
	POPM: [
		["email", "Rating owner · email", "email", ""],
		["rating", "Rating", "rating", 0],
		["counter", "Play count", "number", 0],
	],
};

let state = null;
let busy = false;
const previewURLs = new Set();
const downloadURLs = new Set();

function element(tag, className = "", text) {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text !== undefined) node.textContent = text;
	return node;
}

function button(text, className, onClick) {
	const node = element("button", className, text);
	node.type = "button";
	node.addEventListener("click", onClick);
	return node;
}

function option(value, label = value) {
	const node = element("option", "", label);
	node.value = String(value);
	return node;
}

function removeButton(label, onClick) {
	const node = button("×", "icon-button", onClick);
	node.setAttribute("aria-label", label);
	node.title = label;
	return node;
}

function formatBytes(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function notify(message, tone = "") {
	ui.status.textContent = message;
	ui.status.dataset.tone = tone;
}

function refreshSummary() {
	if (!state) return;

	const count = [...state.entries.values()].filter(
		(entry) => entry.id !== "APIC",
	).length;

	ui.fieldCount.textContent = `${count} tag field${count === 1 ? "" : "s"}`;
	ui.editState.textContent = state.changed ? "Unsaved changes" : "Original / exported";
	ui.editState.dataset.dirty = String(state.changed);

	const rawCount = [...state.entries.values()].filter((entry) => entry.raw).length;
	ui.advanced.hidden = rawCount === 0;
	ui.advancedCount.textContent = String(rawCount);
}

function markChanged(entry) {
	if (!state) return;
	if (entry) entry.dirty = true;
	state.changed = true;
	refreshSummary();
}

async function perform(message, task) {
	if (busy) return;

	busy = true;
	ui.controls.disabled = true;
	document.documentElement.setAttribute("aria-busy", "true");
	notify(message);

	try {
		await new Promise((resolve) => setTimeout(resolve, 0));
		await task();
	} catch (error) {
		console.error(error);
		notify(error instanceof Error ? error.message : "Something went wrong.", "error");
	} finally {
		busy = false;
		ui.controls.disabled = false;
		document.documentElement.removeAttribute("aria-busy");
	}
}

function revokePreview(url) {
	if (!url) return;
	URL.revokeObjectURL(url);
	previewURLs.delete(url);
}

function clearPreviews() {
	for (const url of previewURLs) URL.revokeObjectURL(url);
	previewURLs.clear();
}

function download(blob, filename) {
	const url = URL.createObjectURL(blob);
	downloadURLs.add(url);

	const link = element("a");
	link.href = url;
	link.download = filename;
	document.body.append(link);
	link.click();
	link.remove();
}

/* Preserve untouched frames and the original audio rather than reserializing them. */

function readSize(bytes, offset, synchsafe = false) {
	if (offset + 4 > bytes.length) throw new Error("Truncated ID3 size.");

	let size = 0;
	for (let i = 0; i < 4; i++) {
		const byte = bytes[offset + i];
		if (synchsafe && byte > 127) throw new Error("Invalid ID3 size.");
		size = size * (synchsafe ? 128 : 256) + byte;
	}
	return size;
}

function writeSize(bytes, offset, size, synchsafe = false) {
	const base = synchsafe ? 128 : 256;
	for (let i = 3; i >= 0; i--) {
		bytes[offset + i] = size % base;
		size = Math.floor(size / base);
	}
}

function tagHeader(version, bodyLength) {
	const header = new Uint8Array(10);
	header.set([0x49, 0x44, 0x33, version, 0, 0]);
	writeSize(header, 6, bodyLength, true);
	return header;
}

function joinBytes(parts) {
	const output = new Uint8Array(
		parts.reduce((length, part) => length + part.byteLength, 0),
	);

	let offset = 0;
	for (const part of parts) {
		output.set(part, offset);
		offset += part.byteLength;
	}
	return output;
}

function undoUnsynchronization(bytes) {
	const output = new Uint8Array(bytes.length);
	let length = 0;

	for (let i = 0; i < bytes.length; i++) {
		output[length++] = bytes[i];
		if (bytes[i] === 0xff && bytes[i + 1] === 0) i++;
	}

	return output.subarray(0, length);
}

function parseFrames(body, version, flags) {
	if (version === 3 && (flags & 0x80)) {
		body = undoUnsynchronization(body);
	}

	let offset = 0;
	if (flags & 0x40) {
		const extendedSize = readSize(body, 0, version === 4);
		offset = version === 3 ? extendedSize + 4 : extendedSize;
		if (offset < 6 || offset > body.length) {
			throw new Error("Invalid ID3 extended header.");
		}
	}

	const groups = new Map();
	let count = 0;

	while (offset < body.length) {
		if (body[offset] === 0) {
			if (body.subarray(offset).some((byte) => byte !== 0)) {
				throw new Error("Unexpected data inside ID3 padding.");
			}
			break;
		}

		if (offset + 10 > body.length) throw new Error("Truncated ID3 frame.");

		const id = String.fromCharCode(...body.subarray(offset, offset + 4));
		if (!/^[A-Z0-9]{4}$/.test(id)) throw new Error("Invalid ID3 frame identifier.");

		const size = readSize(body, offset + 4, version === 4);
		const end = offset + 10 + size;
		if (size === 0 || end > body.length) {
			throw new Error(`Invalid ${id} frame size.`);
		}

		if (++count > MAX_FRAMES) {
			throw new Error(`This file exceeds the ${MAX_FRAMES}-frame editing limit.`);
		}

		if (!groups.has(id)) groups.set(id, []);
		groups.get(id).push(body.slice(offset, end));
		offset = end;
	}

	return groups;
}

function mp3Frame(bytes, offset) {
	if (offset + 4 > bytes.length) return null;

	const first = bytes[offset];
	const second = bytes[offset + 1];
	const third = bytes[offset + 2];

	if (first !== 0xff || (second & 0xe0) !== 0xe0) return null;

	const versionBits = (second >> 3) & 3;
	const layerBits = (second >> 1) & 3;
	const bitrateIndex = third >> 4;
	const sampleRateIndex = (third >> 2) & 3;

	// MPEG version 01 is reserved. Layer bits 01 means Layer III.
	if (
		versionBits === 1 ||
		layerBits !== 1 ||
		bitrateIndex === 15 ||
		sampleRateIndex === 3
	) {
		return null;
	}

	const version = versionBits === 3
		? 1
		: versionBits === 2
			? 2
			: 2.5;

	const sampleRateDivisor = version === 1 ? 1 : version === 2 ? 2 : 4;
	const sampleRate = [44100, 48000, 32000][sampleRateIndex] / sampleRateDivisor;

	// A bitrate index of zero is valid for free-format MP3 streams, but their
	// frame length cannot be derived from a single header.
	if (bitrateIndex === 0) {
		return {
			version,
			sampleRate,
			length: null,
			freeFormat: true,
		};
	}

	const bitrates = version === 1
		? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
		: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];

	const bitrate = bitrates[bitrateIndex];
	const padding = (third >> 1) & 1;
	const coefficient = version === 1 ? 144000 : 72000;
	const length = Math.floor(coefficient * bitrate / sampleRate) + padding;

	if (length < 24 || length > 8192) return null;

	return {
		version,
		sampleRate,
		length,
		freeFormat: false,
	};
}

function sameMP3Stream(left, right) {
	return (
		left.version === right.version &&
		left.sampleRate === right.sampleRate
	);
}

function hasMP3Audio(bytes) {
	const recentFrames = [];
	const maxFrameGap = 8192;

	for (let offset = 0; offset + 4 <= bytes.length; offset++) {
		const frame = mp3Frame(bytes, offset);
		if (!frame) continue;

		// Prefer the exact next frame location for ordinary MP3 streams.
		if (frame.length !== null) {
			const nextOffset = offset + frame.length;
			const next = mp3Frame(bytes, nextOffset);

			if (next && sameMP3Stream(frame, next)) {
				return true;
			}
		}

		// This also supports free-format streams and streams with a damaged frame.
		for (let i = recentFrames.length - 1; i >= 0; i--) {
			const previous = recentFrames[i];

			if (offset - previous.offset > maxFrameGap) break;

			if (sameMP3Stream(previous.frame, frame)) {
				return true;
			}
		}

		recentFrames.push({ offset, frame });

		while (
			recentFrames.length &&
			offset - recentFrames[0].offset > maxFrameGap
		) {
			recentFrames.shift();
		}
	}

	return false;
}

async function inspectFile(file) {
	if (!/\.mp3$/i.test(file.name) && file.type !== "audio/mpeg") {
		throw new Error("Choose an MP3 file.");
	}
	if (file.size < 128) throw new Error("This file is too small to be a valid MP3.");

	const head = new Uint8Array(await file.slice(0, 10).arrayBuffer());
	const tail = new Uint8Array(await file.slice(-128).arrayBuffer());

	let version = 3;
	let start = 0;
	let groups = new Map();

	if (head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33) {
		version = head[3];

		if (version !== 3 && version !== 4) {
			throw new Error(
				"This file uses ID3v2.2 or an unsupported ID3 version. " +
				"Convert its tags to ID3v2.3 or ID3v2.4 first.",
			);
		}

		const bodySize = readSize(head, 6, true);
		if (bodySize > MAX_TAG_BYTES) {
			throw new Error("This file exceeds the 16 MB metadata limit.");
		}

		const footerSize = version === 4 && (head[5] & 0x10) ? 10 : 0;
		start = 10 + bodySize + footerSize;
		if (start > file.size) throw new Error("The ID3 header exceeds the file size.");

		const body = new Uint8Array(
			await file.slice(10, 10 + bodySize).arrayBuffer(),
		);
		groups = parseFrames(body, version, head[5]);
	}

	const hasV1 = tail[0] === 0x54 && tail[1] === 0x41 && tail[2] === 0x47;
	const end = file.size - (hasV1 ? 128 : 0);
	if (end <= start) throw new Error("This file contains tags but no MP3 audio.");

	const probe = new Uint8Array(
		await file.slice(start, Math.min(end, start + 1024 * 1024)).arrayBuffer(),
	);

	const isMP4 =
		probe.length >= 12 &&
		probe[4] === 0x66 && // f
		probe[5] === 0x74 && // t
		probe[6] === 0x79 && // y
		probe[7] === 0x70;   // p

	if (isMP4) {
		throw new Error(
			"This file contains MP4/M4A audio, not MP3 audio. " +
			"Renaming an MP4 file to .mp3 does not convert it.",
		);
	}

	if (!hasMP3Audio(probe)) {
		throw new Error(
			"Could not verify an MPEG Layer III stream near the start of the audio.",
		);
	}

	const footer = new Uint8Array(
		await file.slice(Math.max(start, end - 32), end).arrayBuffer(),
	);
	const hasAPE = String.fromCharCode(...footer.subarray(0, 8)) === "APETAGEX";

	return { file, version, start, end, groups, tail: hasV1 ? tail : null, hasAPE };
}

function decodeEntry(id, original, version) {
	const definition = DEFINITIONS.get(id);
	const rawEntry = { id, original, raw: true, dirty: false };

	if (!definition || !definition.versions.includes(version)) return rawEntry;

	const protectedFrame = original.some((frame) => (
		version === 3 ? frame[9] & 0xe0 : frame[9] & 0x4c
	));
	if (protectedFrame) return rawEntry;

	const body = joinBytes(original);
	const buffer = joinBytes([tagHeader(version, body.length), body]).buffer;
	const reader = new MP3Tag(buffer);

	reader.read({
		id3v1: false,
		mp4: false,
		aiff: false,
		aac: false,
		unsupported: true,
	});

	if (reader.error) {
		console.warn(`Keeping ${id} as raw data: ${reader.error}`);
		return rawEntry;
	}

	const value = reader.tags.v2?.[id];
	const expectsArray = definition.kind === "records" || definition.kind === "art";
	if (expectsArray ? !Array.isArray(value) : typeof value !== "string") {
		return rawEntry;
	}

	return { id, definition, value, original, dirty: false, raw: false };
}

function importLegacyTags(entries, tail, version) {
	if (!tail) return;

	const reader = new MP3Tag(tail.buffer);
	reader.read({ id3v2: false, mp4: false, aiff: false, aac: false });

	if (reader.error) throw new Error(`Could not read ID3v1: ${reader.error}`);

	const decoder = new TextDecoder("windows-1252");
	const text = (start, end) => decoder.decode(tail.subarray(start, end))
		.replace(/\0.*$/s, "").trimEnd();

	const hasTrack = tail[125] === 0 && tail[126] !== 0;
	const values = {
		TIT2: text(3, 33),
		TPE1: text(33, 63),
		TALB: text(63, 93),
		[version === 4 ? "TDRC" : "TYER"]: text(93, 97),
		TRCK: hasTrack ? String(tail[126]) : "",
		TCON: reader.tags.v1?.genre || "",
		COMM: text(97, hasTrack ? 125 : 127),
	};

	for (const [id, value] of Object.entries(values)) {
		if (!value || entries.has(id)) continue;

		entries.set(id, {
			id,
			definition: DEFINITIONS.get(id),
			value: id === "COMM"
				? [{ language: "eng", descriptor: "", text: value }]
				: value,
			original: [],
			dirty: true,
			raw: false,
		});
	}
}

/* Controls validate on export, so unusual untouched tags can remain untouched. */

function checkInput(input, label, message = "") {
	input.setCustomValidity(message);
	if (!input.reportValidity()) {
		input.focus();
		throw new Error(`${label}: ${message || input.validationMessage}`);
	}
}

function basicControl(label, kind, value = "") {
	const input = element(kind === "textarea" ? "textarea" : "input");
	input.setAttribute("aria-label", label);
	input.autocomplete = "off";

	const numeric = ["year", "integer", "number"].includes(kind);
	if (kind !== "textarea") {
		input.type = numeric ? "number" : ["url", "email"].includes(kind) ? kind : "text";
	}

	if (numeric) {
		input.min = kind === "year" ? "1" : "0";
		input.max = kind === "year" ? "9999" : String(Number.MAX_SAFE_INTEGER);
		input.step = "1";
	}

	if (kind === "language") {
		input.maxLength = 3;
		input.placeholder = "eng";
	}
	if (kind === "isrc") {
		input.maxLength = 12;
		input.placeholder = "USRC17607839";
	}
	if (kind === "year") input.placeholder = "YYYY";
	if (kind === "url") input.placeholder = "https://";

	input.value = String(value ?? "");
	input.addEventListener("input", () => input.setCustomValidity(""));

	return {
		node: input,
		read() {
			const value = input.value;
			let error = "";

			if (value && numeric && !/^\d+$/.test(value)) {
				error = "Use a whole, non-negative number.";
			} else if (value && kind === "year" && !/^\d{4}$/.test(value)) {
				error = "Enter a four-digit year.";
			} else if (value && kind === "language" && !/^[a-z]{3}$/.test(value)) {
				error = "Use a three-letter lowercase ISO 639-2 code.";
			} else if (value && kind === "isrc" && !/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(value)) {
				error = "Use a 12-character ISRC, without spaces or hyphens.";
			} else if (value.includes("\0")) {
				error = "Null characters are not allowed.";
			}

			checkInput(input, label, error);
			if (kind === "number") {
				checkInput(input, label, value === "" ? "Enter a number." : "");
				return Number(value);
			}
			return value;
		},
	};
}

function labeled(label, control) {
	const wrapper = element("div");
	const caption = element("span", "control-label", label);
	wrapper.append(caption, control.node);
	return wrapper;
}

function selectControl(label, choices, value) {
	const select = element("select");
	select.setAttribute("aria-label", label);

	for (const [key, text] of choices) select.append(option(key, text));
	if (![...select.options].some((item) => item.value === String(value))) {
		select.append(option(value, `${value} · existing`));
	}
	select.value = String(value ?? "");

	return { node: select, read: () => select.value };
}

function validTimestamp(value) {
	const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2})(?::(\d{2})(?::(\d{2}))?)?)?)?)?$/.exec(value);
	if (!match) return false;

	const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match;
	const year = Number(yearText);
	const month = monthText === undefined ? 1 : Number(monthText);
	const day = dayText === undefined ? 1 : Number(dayText);

	if (year < 1 || month < 1 || month > 12 || day < 1) return false;

	const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
	const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

	return day <= days[month - 1] &&
		(hourText === undefined || Number(hourText) < 24) &&
		(minuteText === undefined || Number(minuteText) < 60) &&
		(secondText === undefined || Number(secondText) < 60);
}

function makeControl(label, kind, value = "") {
	if (kind === "genre") {
		const root = element("div", "control-stack");
		const choices = [["", "Not set"], ...GENRE_CHOICES.map((genre) => [genre, genre])];
		const code = /^\(?(\d+)\)?$/.exec(String(value));

		if (code && GENRES[Number(code[1])]) {
			choices.push([value, `${GENRES[Number(code[1])]} · ${value}`]);
		}

		choices.push(["__custom__", "Custom genre…"]);
		const listed = choices.some(([key]) => key === value);
		const select = selectControl(label, choices, listed ? value : "__custom__");
		const custom = basicControl("Custom genre", "text", listed ? "" : value);
		custom.node.placeholder = "Enter a genre";
		custom.node.hidden = select.read() !== "__custom__";

		select.node.addEventListener("change", () => {
			custom.node.hidden = select.read() !== "__custom__";
			if (!custom.node.hidden) custom.node.focus();
		});

		root.append(select.node, custom.node);
		return {
			node: root,
			read: () => select.read() === "__custom__" ? custom.read() : select.read(),
		};
	}

	if (kind === "boolean") {
		return selectControl(label, [["", "Not set"], ["1", "Yes"], ["0", "No"]], value);
	}

	if (kind === "key") {
		const roots = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];
		const choices = [["", "Not set"], ["o", "Off key"]];
		for (const root of roots) {
			choices.push([root, `${root} major`], [`${root}m`, `${root} minor`]);
		}
		return selectControl(label, choices, value);
	}

	if (kind === "rating") {
		const root = element("div");
		const range = element("input");
		const output = element("output", "rating-value");
		range.type = "range";
		range.min = "0";
		range.max = "255";
		range.step = "1";
		range.value = String(value);
		range.setAttribute("aria-label", label);

		const update = () => {
			output.textContent = range.value === "0" ? "Unrated" : `${range.value} / 255`;
			range.setAttribute("aria-valuetext", output.textContent);
		};
		range.addEventListener("input", update);
		update();

		root.append(range, output);
		return { node: root, read: () => Number(range.value) };
	}

	if (kind === "timestamp") {
		const root = element("div", "split-control date-control");
		const year = basicControl(`${label}: year`, "year", String(value).slice(0, 4));
		const remainder = basicControl(`${label}: date and time`, "text", String(value).slice(4));
		remainder.node.placeholder = "Optional: -MM-DD";
		remainder.node.title = "Optional suffix: -MM-DDTHH:mm:ss; reduced precision is allowed.";

		root.append(year.node, remainder.node);
		return {
			node: root,
			read() {
				const result = year.read() + remainder.read();
				checkInput(
					remainder.node,
					label,
					result && !validTimestamp(result)
						? "Use YYYY, YYYY-MM, YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss."
						: "",
				);
				return result;
			},
		};
	}

	if (kind === "position") {
		if (String(value).includes(MULTI_VALUE_SEPARATOR)) {
			const control = basicControl(label, "text", value);
			const read = control.read;
			control.read = () => {
				const result = read();
				const valid = result.split(MULTI_VALUE_SEPARATOR)
					.every((part) => /^\d+(\/\d+)?$/.test(part));
				checkInput(control.node, label, valid ? "" : "Use number/total pairs.");
				if (state.version === 3 && result.includes(MULTI_VALUE_SEPARATOR)) {
					throw new Error(`${label}: ID3v2.3 can only write one number/total pair.`);
				}
				return result;
			};
			return control;
		}

		const root = element("div", "split-control");
		const [number = "", total = ""] = String(value).split("/");
		const position = basicControl(`${label}: number`, "integer", number);
		const count = basicControl(`${label}: total`, "integer", total);
		position.node.min = "1";
		count.node.min = "1";
		position.node.placeholder = "Number";
		count.node.placeholder = "Total";

		root.append(position.node, count.node);
		return {
			node: root,
			read() {
				const number = position.read();
				const total = count.read();
				checkInput(position.node, label, total && !number ? "Enter a number first." : "");
				checkInput(count.node, label, total && Number(total) < Number(number)
					? "The total cannot be smaller than the number." : "");
				return number ? `${number}${total ? `/${total}` : ""}` : "";
			},
		};
	}

	return basicControl(label, kind, value);
}

function recordEditor(entry) {
	const root = element("div");
	const list = element("div", "record-list");
	const records = [];
	const schema = RECORD_FIELDS[entry.id];

	function addRecord(value = {}, dirty = true) {
		const card = element("div", "record");
		const heading = element("div", "record-heading");
		const fields = element("div", "record-fields");
		const controls = new Map();
		const record = { card, controls };

		heading.append(
			element("span", "", "ENTRY"),
			removeButton("Remove entry", () => {
				records.splice(records.indexOf(record), 1);
				card.remove();
				markChanged(entry);
			}),
		);

		for (const [key, label, kind, fallback] of schema) {
			const control = makeControl(label, kind, value[key] ?? fallback);
			controls.set(key, control);
			fields.append(labeled(label, control));
		}

		card.append(heading, fields);
		list.append(card);
		records.push(record);
		if (dirty) markChanged(entry);
	}

	for (const value of entry.value) addRecord(value, false);
	root.append(
		list,
		button("＋ Add entry", "button button-quiet", () => addRecord()),
	);

	return {
		node: root,
		read: () => records.map(({ controls }) => Object.fromEntries(
			[...controls].map(([key, control]) => [key, control.read()]),
		)),
	};
}

/* Artwork is decoded locally; JPEG originals are not recompressed. */

const PREVIEW_IMAGE_MIMES = new Set([
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
]);

function binaryBytes(value) {
	if (value instanceof Uint8Array) {
		return value;
	}

	if (value instanceof ArrayBuffer) {
		return new Uint8Array(value);
	}

	if (ArrayBuffer.isView(value)) {
		return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
	}

	if (typeof value === "string") {
		const dataURL = /^data:([^;,]+);base64,(.+)$/s.exec(value);

		if (dataURL) {
			const binary = atob(dataURL[2].replace(/\s/g, ""));
			return Uint8Array.from(binary, (character) => character.charCodeAt(0));
		}

		return Uint8Array.from(value, (character) => character.charCodeAt(0));
	}

	if (Array.isArray(value)) {
		const numericStrings = value.every(
			(item) => typeof item !== "string" || /^-?\d+$/.test(item),
		);

		return Uint8Array.from(value, (item) => {
			if (typeof item !== "string") return Number(item);
			return numericStrings ? Number(item) : item.charCodeAt(0);
		});
	}

	throw new TypeError("Unsupported embedded artwork data.");
}

function normalizeImageMime(format) {
	const value = String(format ?? "")
		.replace(/\0/g, "")
		.trim()
		.toLowerCase();

	const aliases = {
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		"image/jpg": "image/jpeg",
		png: "image/png",
		gif: "image/gif",
		webp: "image/webp",
	};

	const mime = aliases[value] ?? value;
	return PREVIEW_IMAGE_MIMES.has(mime) ? mime : "";
}

function detectImageMime(bytes, offset = 0) {
	if (
		bytes[offset] === 0xff &&
		bytes[offset + 1] === 0xd8 &&
		bytes[offset + 2] === 0xff
	) {
		return "image/jpeg";
	}

	if (
		bytes[offset] === 0x89 &&
		bytes[offset + 1] === 0x50 &&
		bytes[offset + 2] === 0x4e &&
		bytes[offset + 3] === 0x47 &&
		bytes[offset + 4] === 0x0d &&
		bytes[offset + 5] === 0x0a &&
		bytes[offset + 6] === 0x1a &&
		bytes[offset + 7] === 0x0a
	) {
		return "image/png";
	}

	const header = String.fromCharCode(
		...bytes.subarray(offset, Math.min(offset + 12, bytes.length)),
	);

	if (header.startsWith("GIF87a") || header.startsWith("GIF89a")) {
		return "image/gif";
	}

	if (header.startsWith("RIFF") && header.slice(8, 12) === "WEBP") {
		return "image/webp";
	}

	return "";
}

function previewImageData(value, declaredFormat) {
	const source = binaryBytes(value);

	// A few tag writers leave padding or a short preamble before the image.
	const searchLimit = Math.min(source.length, 4096);

	for (let offset = 0; offset < searchLimit; offset++) {
		const mime = detectImageMime(source, offset);

		if (mime) {
			return {
				bytes: source.subarray(offset),
				originalSize: source.length,
				mime,
			};
		}
	}

	// Browsers may still decode a valid image whose signature is unusual.
	return {
		bytes: source,
		originalSize: source.length,
		mime: normalizeImageMime(declaredFormat),
	};
}

function imageMime(value, declaredFormat = "") {
	return previewImageData(value, declaredFormat).mime;
}

async function jpegArtwork(file) {
	if (file.size > MAX_IMAGE_BYTES) throw new Error("Artwork must be 12 MB or smaller.");

	const bytes = binaryBytes(await file.arrayBuffer());
	const mime = imageMime(bytes);
	if (!mime) throw new Error("Choose a JPEG, PNG, WebP or GIF image.");

	let bitmap;
	try {
		bitmap = await createImageBitmap(new Blob([bytes], { type: mime }));
	} catch (error) {
		throw new Error("The browser could not decode this image.", { cause: error });
	}

	try {
		if (!bitmap.width || !bitmap.height ||
			bitmap.width * bitmap.height > MAX_IMAGE_PIXELS ||
			bitmap.width > 8192 || bitmap.height > 8192) {
			throw new Error("Artwork must be at most 24 megapixels and 8192 pixels per side.");
		}

		if (mime === "image/jpeg") return bytes;

		const canvas = document.createElement("canvas");
		canvas.width = bitmap.width;
		canvas.height = bitmap.height;

		const context = canvas.getContext("2d");
		if (!context) throw new Error("A canvas could not be created.");

		context.fillStyle = "#ffffff";
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.drawImage(bitmap, 0, 0);

		const blob = await new Promise((resolve, reject) => {
			canvas.toBlob(
				(result) => result ? resolve(result) : reject(new Error("JPEG conversion failed.")),
				"image/jpeg",
				0.94,
			);
		});

		const result = new Uint8Array(await blob.arrayBuffer());
		if (result.length > MAX_IMAGE_BYTES) {
			throw new Error("The converted JPEG exceeds 12 MB. Choose a smaller image.");
		}
		return result;
	} finally {
		bitmap.close();
	}
}

function createArtEntry() {
	const entry = {
		id: "APIC",
		definition: DEFINITIONS.get("APIC"),
		value: [],
		original: [],
		dirty: true,
		raw: false,
	};
	state.entries.set(entry.id, entry);
	renderArtwork(entry);
	return entry;
}

function renderArtwork(entry) {
	const pictures = [];
	entry.pictures = pictures;

	function addPicture(value, dirty = false) {
		const picture = { ...value, url: null };
		const card = element("div", "picture-card");
		const preview = element("div", "picture-preview");
		const controls = element("div", "picture-controls");
		const actions = element("div", "raw-actions");
		const information = element("p", "picture-info");

		const type = selectControl(
			"Picture type",
			PICTURE_TYPES.map((label, index) => [index, label]),
			value.type,
		);
		const description = basicControl("Picture description", "text", value.description);
		description.node.maxLength = 64;
		description.node.placeholder = "Description (optional)";

		const iconOption = [...type.node.options].find((item) => item.value === "1");
		if (iconOption && value.type !== 1) iconOption.disabled = true;

		const input = element("input");
		input.type = "file";
		input.accept = ui.artInput.accept;
		input.hidden = true;

		function updatePreview() {
			revokePreview(picture.url);
			picture.url = null;
			preview.replaceChildren();

			let imageData;

			try {
				imageData = previewImageData(picture.data, picture.format);
			} catch (error) {
				console.warn("Could not read embedded artwork:", error);
				information.textContent = `${picture.format || "unknown format"} · unreadable data`;
				preview.append(
					element("span", "", "Preview unavailable · original image retained"),
				);
				return;
			}

			information.textContent = [
				picture.format || imageData.mime || "unknown format",
				formatBytes(imageData.originalSize),
			].join(" · ");

			if (!imageData.mime || imageData.bytes.length === 0) {
				preview.append(
					element("span", "", "Preview unavailable · original image retained"),
				);
				return;
			}

			const image = element("img");
			image.alt = picture.description || "Embedded cover art";
			image.decoding = "async";

			picture.url = URL.createObjectURL(
				new Blob([imageData.bytes], { type: imageData.mime }),
			);
			previewURLs.add(picture.url);

			image.addEventListener("load", () => {
				preview.dataset.preview = "available";
			}, { once: true });

			image.addEventListener("error", () => {
				revokePreview(picture.url);
				picture.url = null;
				preview.removeAttribute("data-preview");
				preview.replaceChildren(
					element("span", "", "The embedded image could not be decoded."),
				);
			}, { once: true });

			image.src = picture.url;
			preview.append(image);
		}

		input.addEventListener("change", () => {
			const file = input.files[0];
			input.value = "";
			if (!file) return;

			perform("Preparing artwork…", async () => {
				picture.data = Array.from(await jpegArtwork(file));
				picture.format = "image/jpeg";
				if (type.read() === "1") type.node.value = "3";
				if (iconOption) iconOption.disabled = true;
				updatePreview();
				markChanged(entry);
				notify("Artwork replaced.", "success");
			});
		});

		actions.append(
			button("Replace", "button button-secondary", () => input.click()),
			button("Remove", "button button-quiet", () => {
				revokePreview(picture.url);
				pictures.splice(pictures.indexOf(picture), 1);
				card.remove();
				markChanged(entry);
			}),
		);

		controls.append(type.node, description.node, information, actions, input);
		card.append(preview, controls);
		card.addEventListener("input", () => markChanged(entry));
		card.addEventListener("change", () => markChanged(entry));

		picture.descriptionInput = description.node;

		picture.read = () => ({
			format: picture.format,
			type: Number(type.read()),
			description: description.read(),
			data: picture.data,
		});

		pictures.push(picture);
		ui.covers.append(card);
		updatePreview();
		if (dirty) markChanged(entry);
	}

	for (const value of entry.value) addPicture(value);
	entry.addPicture = addPicture;
	entry.read = () => {
		const values = pictures.map((picture) => picture.read());

		if (values.length <= 1) {
			return values;
		}

		const usedDescriptions = new Set();

		// Preserve user-provided descriptions, but reject explicit duplicates.
		for (let index = 0; index < values.length; index++) {
			const description = values[index].description;

			if (!description.trim()) continue;

			if (usedDescriptions.has(description)) {
				checkInput(
					pictures[index].descriptionInput,
					"Artwork description",
					"Use a unique description for each artwork image.",
				);
			}

			usedDescriptions.add(description);
		}

		// mp3tag.js requires APIC descriptions to be unique. Generate useful
		// descriptions for blank fields when more than one image is present.
		for (let index = 0; index < values.length; index++) {
			if (values[index].description.trim()) continue;

			const base =
				PICTURE_TYPES[values[index].type] ||
				`Artwork ${index + 1}`;

			let generated = base;
			let suffix = 2;

			while (usedDescriptions.has(generated)) {
				generated = `${base} ${suffix}`;
				suffix++;
			}

			values[index].description = generated;
			pictures[index].descriptionInput.value = generated;
			usedDescriptions.add(generated);
		}

		return values;
	};
}

async function addArtwork(file) {
	if (!state) {
		notify("Open an MP3 before adding artwork.", "error");
		return;
	}

	await perform("Preparing artwork…", async () => {
		let entry = state.entries.get("APIC");
		if (entry?.raw) {
			throw new Error("Remove the advanced APIC frame before adding replacement artwork.");
		}

		const data = Array.from(await jpegArtwork(file));
		if (!entry) entry = createArtEntry();

		entry.addPicture({
			format: "image/jpeg",
			type: 3,
			description: "",
			data,
		}, true);

		notify("Artwork added. Transparent areas become white; animated images use one frame.", "success");
	});
}

/* Unknown frames use binary payload inputs instead of pretending they are text. */

function rawEditor(entry) {
	const root = element("div");
	const records = [];

	for (const original of entry.original) {
		const record = { bytes: original };
		const card = element("div", "raw-record");
		const information = element("p");
		const actions = element("div", "raw-actions");
		const input = element("input");
		input.type = "file";
		input.hidden = true;

		const update = () => {
			information.textContent = `${formatBytes(record.bytes.length - 10)} encoded payload`;
		};

		input.addEventListener("change", () => {
			const file = input.files[0];
			input.value = "";
			if (!file) return;

			perform(`Replacing ${entry.id}…`, async () => {
				if (!file.size || file.size > MAX_TAG_BYTES - 10) {
					throw new Error("A frame payload must be non-empty and smaller than 16 MB.");
				}

				const payload = new Uint8Array(await file.arrayBuffer());
				const header = record.bytes.slice(0, 10);
				writeSize(header, 4, payload.length, state.version === 4);
				record.bytes = joinBytes([header, payload]);
				update();
				markChanged(entry);
				notify(`${entry.id} payload replaced. Its existing encoding flags are retained.`, "success");
			});
		});

		actions.append(
			button("Download .bin", "button button-secondary", () => {
				download(new Blob([record.bytes.subarray(10)]), `${entry.id}.bin`);
			}),
			button("Replace", "button button-secondary", () => input.click()),
			button("Remove", "button button-quiet", () => {
				records.splice(records.indexOf(record), 1);
				card.remove();
				markChanged(entry);
			}),
		);

		records.push(record);
		card.append(information, actions, input);
		root.append(card);
		update();
	}

	return { node: root, read: () => records.map((record) => record.bytes) };
}

function refreshPicker() {
	ui.picker.replaceChildren();

	const available = TAGS.filter((tag) => (
		tag.id !== "APIC" &&
		tag.versions.includes(state.version) &&
		!state.entries.has(tag.id)
	));

	ui.picker.append(option("", available.length ? "Choose a tag…" : "All available tags are added"));
	for (const tag of available) {
		ui.picker.append(option(tag.id, `${tag.label} · ${tag.id}`));
	}

	ui.addTag.disabled = available.length === 0;
	ui.picker.disabled = available.length === 0;
	refreshSummary();
}

function renderEntry(entry) {
	if (!entry.raw && entry.definition.kind === "art") {
		renderArtwork(entry);
		return;
	}

	const wide = entry.raw || entry.definition.kind === "records";
	const card = element("section", `tag-card${wide ? " wide" : ""}`);
	const heading = element("div", "tag-heading");
	const title = entry.raw ? entry.id : entry.definition.label;

	heading.append(
		element("h3", "", title),
		element("span", "frame-id", entry.id),
		removeButton(`Remove ${title} tag`, () => {
			state.entries.delete(entry.id);
			card.remove();
			markChanged();
			refreshPicker();
			ui.picker.focus();
		}),
	);

	const control = entry.raw
		? rawEditor(entry)
		: entry.definition.kind === "records"
			? recordEditor(entry)
			: makeControl(title, entry.definition.kind, entry.value);

	entry.read = control.read;
	entry.element = card;

	card.append(heading, control.node);
	card.addEventListener("input", () => markChanged(entry));
	card.addEventListener("change", () => markChanged(entry));

	(entry.raw ? ui.rawFields : ui.fields).append(card);
}

function addTag(id, focus = true) {
	const definition = DEFINITIONS.get(id);
	if (!definition || !definition.versions.includes(state.version) ||
		state.entries.has(id) || definition.kind === "art") {
		return;
	}

	let value = "";
	if (definition.kind === "records") {
		value = [Object.fromEntries(
			RECORD_FIELDS[id].map(([key, , , fallback]) => [key, fallback]),
		)];
	}

	const entry = {
		id, definition, value, original: [], dirty: true, raw: false,
	};

	state.entries.set(id, entry);
	renderEntry(entry);
	markChanged(entry);
	refreshPicker();

	if (focus) {
		entry.element.querySelector("input, select, textarea")?.focus();
	}
}

async function openFile(file, askToDiscard = true) {
	if (busy) return;
	if (askToDiscard && state?.changed &&
		!window.confirm("Discard your current changes and open another file?")) {
		return;
	}

	await perform("Reading tags…", async () => {
		const source = await inspectFile(file);
		const entries = new Map();

		for (const [id, original] of source.groups) {
			entries.set(id, decodeEntry(id, original, source.version));
		}

		importLegacyTags(entries, source.tail, source.version);

		clearPreviews();
		ui.fields.replaceChildren();
		ui.rawFields.replaceChildren();
		ui.covers.replaceChildren();
		ui.advanced.open = false;

		state = { ...source, entries, changed: false };

		for (const definition of TAGS) {
			const entry = entries.get(definition.id);
			if (entry) renderEntry(entry);
		}
		for (const entry of entries.values()) {
			if (!DEFINITIONS.has(entry.id)) renderEntry(entry);
		}

		if (entries.size === 0) {
			for (const id of [
				"TIT2", "TPE1", "TALB", source.version === 4 ? "TDRC" : "TYER", "TCON",
			]) {
				addTag(id, false);
			}
			state.changed = false;
		}

		ui.empty.hidden = true;
		ui.workspace.hidden = false;
		ui.reset.hidden = false;
		ui.fileName.textContent = file.name;
		ui.fileName.title = file.name;
		ui.fileDetails.textContent = [
			formatBytes(file.size),
			`ID3v2.${source.version} output`,
			source.tail ? "ID3v1 migrated" : "Original audio",
		].join("  /  ");

		$("page-title").textContent = "Make it yours.";
		refreshPicker();

		notify(
			source.hasAPE
				? "Loaded. APEv2 metadata is retained unchanged; this editor edits ID3 tags."
				: "Loaded. Drop another MP3 anywhere to switch files.",
			"success",
		);
	});
}

function encodeEditedEntry(entry) {
	const value = entry.read();

	if (entry.raw) return value;
	if (value === "" || (Array.isArray(value) && value.length === 0)) return [];

	const writer = new MP3Tag(new ArrayBuffer(0));
	writer.tags = { v2: { [entry.id]: value } };
	writer.save({
		strict: true,
		id3v1: { include: false },
		id3v2: {
			include: true,
			version: state.version,
			padding: 0,
			unsupported: false,
			unsynch: false,
			encoding: state.version === 3 ? "utf-16" : "utf-8",
		},
	});

	if (writer.error) {
		throw new Error(`${entry.definition.label}: ${writer.error}`);
	}

	const encoded = new Uint8Array(writer.buffer);
	const length = readSize(encoded, 6, true);
	if (encoded.length !== 10 + length) {
		throw new Error(`Unexpected output while encoding ${entry.id}.`);
	}

	return [encoded.slice(10)];
}

async function exportMP3() {
	if (!state || busy) return;

	await perform("Preparing export…", async () => {
		const parts = [];

		for (const entry of state.entries.values()) {
			parts.push(...(entry.dirty ? encodeEditedEntry(entry) : entry.original));
		}

		const bodyLength = parts.reduce((length, part) => length + part.length, 0);
		if (bodyLength > MAX_TAG_BYTES) {
			throw new Error("The edited metadata exceeds 16 MB. Remove or reduce some artwork.");
		}

		const tagParts = bodyLength ? [tagHeader(state.version, bodyLength), ...parts] : [];

		// Blob slices copy the original payload without decoding or re-encoding audio.
		const blob = new Blob([
			...tagParts,
			state.file.slice(state.start, state.end),
		], { type: "audio/mpeg" });

		const base = state.file.name.replace(/\.mp3$/i, "");
		download(blob, `${base}.liner.mp3`);

		state.changed = false;
		refreshSummary();
		notify("Export ready. Download started.", "success");
	});
}

function acceptOneFile(files, callback) {
	if (busy) return;
	if (files.length !== 1) {
		notify("Please choose one file at a time.", "error");
		return;
	}
	callback(files[0]);
}

function bindDropZone(target, callback) {
	let depth = 0;

	const isFileDrag = (event) => [...(event.dataTransfer?.types ?? [])].includes("Files");

	target.addEventListener("dragenter", (event) => {
		if (!isFileDrag(event)) return;
		event.preventDefault();
		event.stopPropagation();
		depth++;
		if (!busy) target.classList.add("is-dragging");
	});

	target.addEventListener("dragover", (event) => {
		if (!isFileDrag(event)) return;
		event.preventDefault();
		event.stopPropagation();
		event.dataTransfer.dropEffect = busy ? "none" : "copy";
	});

	target.addEventListener("dragleave", (event) => {
		if (!isFileDrag(event)) return;
		event.stopPropagation();
		depth = Math.max(0, depth - 1);
		if (!depth) target.classList.remove("is-dragging");
	});

	target.addEventListener("drop", (event) => {
		event.preventDefault();
		event.stopPropagation();
		depth = 0;
		target.classList.remove("is-dragging");
		document.documentElement.classList.remove("is-dragging");
		acceptOneFile(event.dataTransfer.files, callback);
	});
}

$("open-button").addEventListener("click", () => ui.fileInput.click());
$("choose-button").addEventListener("click", () => ui.fileInput.click());
$("add-art-button").addEventListener("click", () => ui.artInput.click());

ui.fileInput.addEventListener("change", () => {
	const files = [...ui.fileInput.files];
	ui.fileInput.value = "";
	if (files.length) acceptOneFile(files, openFile);
});

ui.artInput.addEventListener("change", () => {
	const files = [...ui.artInput.files];
	ui.artInput.value = "";
	if (files.length) acceptOneFile(files, addArtwork);
});

ui.addTag.addEventListener("click", () => {
	if (ui.picker.value) addTag(ui.picker.value);
	else ui.picker.focus();
});

ui.reset.addEventListener("click", () => {
	if (!state || busy) return;
	if (state.changed && !window.confirm("Reset all edits to the original file?")) return;
	openFile(state.file, false);
});

ui.form.addEventListener("submit", (event) => {
	event.preventDefault();
	exportMP3();
});

bindDropZone(document.documentElement, openFile);
bindDropZone(ui.artZone, addArtwork);

document.addEventListener("keydown", (event) => {
	if (!(event.ctrlKey || event.metaKey) || event.altKey) return;

	if (event.key.toLowerCase() === "s" && state) {
		event.preventDefault();
		exportMP3();
	}

	if (event.key.toLowerCase() === "o" && !busy) {
		event.preventDefault();
		ui.fileInput.click();
	}
});

window.addEventListener("beforeunload", (event) => {
	if (!state?.changed && !busy) return;
	event.preventDefault();
	event.returnValue = "";
});

window.addEventListener("pagehide", () => {
	clearPreviews();

	for (const url of downloadURLs) {
		URL.revokeObjectURL(url);
	}

	downloadURLs.clear();
});

ui.controls.disabled = false;
notify("Ready when you are.");