// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

import { AwakeIndicator } from "./ui/indicator.js";

export default class AwakeExtension extends Extension {
	enable() {
		this._indicator = new AwakeIndicator(this);
	}

	disable() {
		this._indicator.destroy();
		this._indicator = null;
	}
}
