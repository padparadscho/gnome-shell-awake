// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

import Clutter from "gi://Clutter";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import GObject from "gi://GObject";
import St from "gi://St";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as QuickSettings from "resource:///org/gnome/shell/ui/quickSettings.js";

import {
	COUNTDOWN_TIMER_KEY,
	ENABLE_NOTIFICATIONS_KEY,
	ENABLE_TIMER_KEY,
} from "../config.js";
import { DISABLED_ICON, ENABLED_ICON } from "../constants.js";
import { InhibitorManager } from "../lib/inhibitorManager.js";
import { AwakeToggle } from "./quickSettingsToggle.js";

export const AwakeIndicator = GObject.registerClass(
	class AwakeIndicator extends QuickSettings.SystemIndicator {
		constructor(extension) {
			super();

			this._settings = extension.getSettings();
			this._awake = false;
			this._countdownId = null;
			this._timeoutId = null;

			this._indicator = this._addIndicator();
			this._indicator.gicon = Gio.ThemedIcon.new(ENABLED_ICON);

			this._timerLabel = new St.Label({
				y_expand: true,
				y_align: Clutter.ActorAlign.CENTER,
			});
			this._timerLabel.visible = false;
			this.add_child(this._timerLabel);

			this._toggle = new AwakeToggle(this._settings, extension);
			this._toggle.connectObject("clicked", () => this._toggleAwake(), this);
			this._toggle.connectObject(
				"timer-selected",
				() => this._onTimerSelected(),
				this,
			);
			this.quickSettingsItems.push(this._toggle);

			this._inhibitorManager = new InhibitorManager(this._settings);
			this._inhibitorManager.connectObject(
				"update",
				() => this._updateState(),
				this,
			);

			this._settings.connectObject(
				`changed::${ENABLE_TIMER_KEY}`,
				() => this._updateTimerLabelVisibility(),
				this,
			);

			Main.panel.statusArea.quickSettings.addExternalIndicator(this);
			this._updateState();
		}

		_toggleAwake() {
			this._inhibitorManager.setUserEnabled(!this._awake);

			if (this._awake) {
				if (this._settings.get_int(COUNTDOWN_TIMER_KEY) !== 0)
					this._startTimer();
			} else {
				this._stopTimer();
			}
		}

		_onTimerSelected() {
			this._startTimer();
			this._inhibitorManager.setUserEnabled(true);
		}

		_startTimer() {
			this._stopTimer();

			let time = this._settings.get_int(COUNTDOWN_TIMER_KEY);
			if (time === 0) return;

			this._countdownId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
				time -= 1;
				this._updateCountdown(time);
				return GLib.SOURCE_CONTINUE;
			});
			this._timeoutId = GLib.timeout_add_once(
				GLib.PRIORITY_DEFAULT,
				time * 1000,
				() => {
					this._timeoutId = null;
					this._stopTimer();
					this._inhibitorManager.setUserEnabled(false);
				},
			);

			this._updateCountdown(time);
		}

		_stopTimer() {
			if (this._countdownId) {
				GLib.Source.remove(this._countdownId);
				this._countdownId = null;
			}
			if (this._timeoutId) {
				GLib.Source.remove(this._timeoutId);
				this._timeoutId = null;
			}

			this._updateCountdown(null);
		}

		_updateCountdown(time) {
			const text = time === null ? null : this._formatTime(time);
			this._timerLabel.text = text ?? "";
			this._toggle.setCountdown(text);
			this._updateTimerLabelVisibility();
		}

		_updateTimerLabelVisibility() {
			this._timerLabel.visible =
				this._countdownId !== null &&
				this._settings.get_boolean(ENABLE_TIMER_KEY);
		}

		_formatTime(time) {
			const minutes = Math.floor(time / 60)
				.toString()
				.padStart(2, "0");
			const seconds = (time % 60).toString().padStart(2, "0");
			return `${minutes}:${seconds}`;
		}

		_updateState() {
			const awake = this._inhibitorManager.isInhibited;

			this._indicator.visible = awake;
			this._toggle.checked = awake;

			if (awake !== this._awake) {
				this._awake = awake;
				this._onAwakeChanged();
			}
		}

		_onAwakeChanged() {
			if (!this._settings.get_boolean(ENABLE_NOTIFICATIONS_KEY)) return;

			const message = this._awake ? "Awake enabled" : "Awake disabled";
			const icon = Gio.ThemedIcon.new(
				this._awake ? ENABLED_ICON : DISABLED_ICON,
			);
			Main.osdWindowManager.showAll(icon, message, null, null);
		}

		destroy() {
			this._stopTimer();
			this.quickSettingsItems.forEach((quickSettingsItem) => {
				quickSettingsItem.destroy();
			});
			this._inhibitorManager.destroy();
			this._inhibitorManager = null;
			this._settings = null;
			super.destroy();
		}
	},
);
