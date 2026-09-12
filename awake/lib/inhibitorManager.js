// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

import Gio from "gi://Gio";
import GLib from "gi://GLib";
import GObject from "gi://GObject";

import { ENABLE_MPRIS_KEY } from "../config.js";
import { SESSION_MANAGER_INTERFACE } from "../constants.js";
import { MprisMediaPlayer } from "./mprisMediaPlayer.js";

export const InhibitorManager = GObject.registerClass(
	{
		Signals: { update: {} },
	},
	class InhibitorManager extends GObject.Object {
		constructor(settings) {
			super();

			this._settings = settings;
			this._isInhibited = false;
			this._inhibitorCookie = null;
			this._userEnabled = false;
			this._ignoredReasons = [];

			const SessionManagerProxy = Gio.DBusProxy.makeProxyWrapper(
				SESSION_MANAGER_INTERFACE,
			);
			this._sessionManager = new SessionManagerProxy(
				Gio.DBus.session,
				"org.gnome.SessionManager",
				"/org/gnome/SessionManager",
			);

			this._settings.connectObject(
				`changed::${ENABLE_MPRIS_KEY}`,
				() => this._onMprisChanged(),
				this,
			);

			this._onMprisChanged();
		}

		get isInhibited() {
			return this._isInhibited;
		}

		_onMprisChanged() {
			if (this._settings.get_boolean(ENABLE_MPRIS_KEY)) {
				if (!MprisMediaPlayer.isActive)
					MprisMediaPlayer.get().connectIsPlaying(() => this._updateState());
			} else {
				MprisMediaPlayer.destroy();
			}

			this._updateState();
		}

		_getReasons() {
			const reasons = [];
			if (MprisMediaPlayer.isActive && MprisMediaPlayer.get().isPlaying)
				reasons.push("mpris");
			if (this._userEnabled) reasons.push("user");
			return reasons;
		}

		_updateState() {
			let reasons = this._getReasons();
			this._ignoredReasons = this._ignoredReasons.filter((reason) =>
				reasons.includes(reason),
			);
			reasons = reasons.filter(
				(reason) => !this._ignoredReasons.includes(reason),
			);

			if (reasons.length > 0) {
				if (!this._isInhibited) this._addInhibitor();
			} else if (this._isInhibited) {
				this._removeInhibitor();
			}

			this.emit("update");
		}

		_addInhibitor() {
			const cookie = this._sessionManager.call_sync(
				"Inhibit",
				GLib.Variant.new_tuple([
					GLib.Variant.new_string("awake-gnome-extension"),
					GLib.Variant.new_uint32(0),
					GLib.Variant.new_string("Inhibited by Awake extension"),
					GLib.Variant.new_uint32(8), // Inhibit idle flag
				]),
				Gio.DBusCallFlags.NONE,
				-1,
				null,
			);
			this._inhibitorCookie = cookie.get_child_value(0).get_uint32();
			this._isInhibited = true;
		}

		_removeInhibitor() {
			this._sessionManager.UninhibitRemote(this._inhibitorCookie);
			this._inhibitorCookie = null;
			this._isInhibited = false;
		}

		setUserEnabled(enabled) {
			this._userEnabled = enabled;
			if (!enabled) this._ignoredReasons = this._getReasons();

			this._updateState();
		}

		destroy() {
			this._settings.disconnectObject(this);
			MprisMediaPlayer.destroy();

			if (this._isInhibited) this._removeInhibitor();
		}
	},
);
