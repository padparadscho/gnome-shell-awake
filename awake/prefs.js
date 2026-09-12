// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

import Adw from "gi://Adw";
import Gio from "gi://Gio";

import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

import {
	ENABLE_MPRIS_KEY,
	ENABLE_NOTIFICATIONS_KEY,
	ENABLE_TIMER_KEY,
} from "./config.js";

export default class AwakePreferences extends ExtensionPreferences {
	fillPreferencesWindow(window) {
		const settings = this.getSettings();
		const page = new Adw.PreferencesPage();
		const group = new Adw.PreferencesGroup();
		page.add(group);

		const notificationsRow = new Adw.SwitchRow({
			title: "Notifications",
			subtitle: "Show a notification when the extension is enabled or disabled",
		});
		settings.bind(
			ENABLE_NOTIFICATIONS_KEY,
			notificationsRow,
			"active",
			Gio.SettingsBindFlags.DEFAULT,
		);
		group.add(notificationsRow);

		const timerRow = new Adw.SwitchRow({
			title: "Timer",
			subtitle:
				"Show the remaining time in the top panel while the timer is running",
		});
		settings.bind(
			ENABLE_TIMER_KEY,
			timerRow,
			"active",
			Gio.SettingsBindFlags.DEFAULT,
		);
		group.add(timerRow);

		const mprisRow = new Adw.SwitchRow({
			title: "MPRIS",
			subtitle: "Keep the device awake while an application is playing media",
		});
		settings.bind(
			ENABLE_MPRIS_KEY,
			mprisRow,
			"active",
			Gio.SettingsBindFlags.DEFAULT,
		);
		group.add(mprisRow);

		window.add(page);
	}
}
