// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

import Gio from "gi://Gio";
import GObject from "gi://GObject";

import { PopupAnimation } from "resource:///org/gnome/shell/ui/boxpointer.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as QuickSettings from "resource:///org/gnome/shell/ui/quickSettings.js";

import { COUNTDOWN_TIMER_KEY } from "../config.js";
import {
	DISABLED_ICON,
	ENABLED_ICON,
	MENU_ICON,
	TIMERS,
} from "../constants.js";

export const AwakeToggle = GObject.registerClass(
	{
		Signals: { "timer-selected": {} },
	},
	class AwakeToggle extends QuickSettings.QuickMenuToggle {
		constructor(settings, extension) {
			super({
				title: "Awake",
				toggleMode: false,
			});

			this._settings = settings;
			this._extension = extension;
			this._countdownText = null;
			this._enabledIcon = Gio.ThemedIcon.new(ENABLED_ICON);
			this._disabledIcon = Gio.ThemedIcon.new(DISABLED_ICON);

			this.menu.setHeader(MENU_ICON, "Awake Timer", null);

			this._timerSection = new PopupMenu.PopupMenuSection();
			this._timerItems = new Map();
			for (const timer of TIMERS) {
				const timerItem = new PopupMenu.PopupImageMenuItem(
					timer.label,
					timer.icon,
				);
				timerItem.connect("activate", () => this._selectTimer(timer.duration));
				this._timerItems.set(timer.duration, timerItem);
				this._timerSection.addMenuItem(timerItem);
			}
			this.menu.addMenuItem(this._timerSection);

			this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
			const settingsItem = this.menu.addAction("Awake Settings", () =>
				this._openPreferences(),
			);
			settingsItem.visible = Main.sessionMode.allowSettings;
			this.menu._settingsActions[this._extension.uuid] = settingsItem;

			this._settings.connectObject(
				`changed::${COUNTDOWN_TIMER_KEY}`,
				() => this._syncTimer(),
				this,
			);
			this.connectObject(
				"notify::checked",
				() => {
					this._updateIcon();
					this._updateSubtitle();
				},
				this,
			);

			this._syncTimer();
			this._updateIcon();
		}

		setCountdown(text) {
			this._countdownText = text;
			this.menu.setHeader(MENU_ICON, "Awake Timer", text);
			this._updateSubtitle();
		}

		_selectTimer(duration) {
			this._settings.set_int(COUNTDOWN_TIMER_KEY, duration);
			this.emit("timer-selected");
		}

		_syncTimer() {
			const activeTimer = this._settings.get_int(COUNTDOWN_TIMER_KEY);
			for (const [duration, timerItem] of this._timerItems)
				timerItem.setOrnament(
					duration === activeTimer
						? PopupMenu.Ornament.CHECK
						: PopupMenu.Ornament.NONE,
				);

			this._updateSubtitle();
		}

		_updateIcon() {
			this.gicon = this.checked ? this._enabledIcon : this._disabledIcon;
		}

		_updateSubtitle() {
			if (this._countdownText !== null) {
				this.subtitle = this._countdownText;
				return;
			}

			const timer = TIMERS.find(
				(entry) =>
					entry.duration === this._settings.get_int(COUNTDOWN_TIMER_KEY),
			);
			this.subtitle =
				!this.checked && timer.duration !== 0 ? timer.label : null;
		}

		_openPreferences() {
			this._extension.openPreferences();
			Main.panel.statusArea.quickSettings.menu.close(PopupAnimation.FADE);
		}

		destroy() {
			this.menu.destroy();
			super.destroy();
		}
	},
);
