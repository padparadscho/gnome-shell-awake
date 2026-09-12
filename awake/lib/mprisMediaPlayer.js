// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

import Gio from "gi://Gio";
import GObject from "gi://GObject";

import { DBUS_INTERFACE, MPRIS_INTERFACE } from "../constants.js";

export const MprisMediaPlayer = GObject.registerClass(
	{
		Signals: {
			"is-playing": { param_types: [GObject.TYPE_BOOLEAN] },
		},
	},
	class MprisMediaPlayer extends GObject.Object {
		static _instance = null;

		static get isActive() {
			return MprisMediaPlayer._instance !== null;
		}

		static get() {
			MprisMediaPlayer._instance ??= new MprisMediaPlayer();
			return MprisMediaPlayer._instance;
		}

		static destroy() {
			MprisMediaPlayer._instance?._disconnect();
			MprisMediaPlayer._instance = null;
		}

		constructor() {
			super();

			this._players = new Map();
			this._isPlaying = false;
			this._lastEmittedPlaying = false;

			const DBusProxy = Gio.DBusProxy.makeProxyWrapper(DBUS_INTERFACE);
			this._playerProxyClass = Gio.DBusProxy.makeProxyWrapper(MPRIS_INTERFACE);
			this._dbusProxy = new DBusProxy(
				Gio.DBus.session,
				"org.freedesktop.DBus",
				"/org/freedesktop/DBus",
				() => this._onPlayerChanged(),
			);
			this._dbusSignalId = this._dbusProxy.connectSignal(
				"NameOwnerChanged",
				(_proxy, _sender, args) => this._onOwnerChanged(args),
			);

			this._refresh();
		}

		get isPlaying() {
			return this._isPlaying;
		}

		connectIsPlaying(callback) {
			this.connect("is-playing", (_player, isPlaying) => callback(isPlaying));
		}

		_refresh() {
			const [names] = this._dbusProxy.ListNamesSync();
			for (const name of names) this._addPlayer(name);

			this._onPlayerChanged();
		}

		_addPlayer(name) {
			if (
				!name.startsWith("org.mpris.MediaPlayer2.") ||
				this._players.has(name)
			)
				return;

			const playerProxy = new this._playerProxyClass(
				Gio.DBus.session,
				name,
				"/org/mpris/MediaPlayer2",
				() => this._onPlayerChanged(),
			);
			const signalId = playerProxy.connect("g-properties-changed", () =>
				this._onPlayerChanged(),
			);
			this._players.set(name, { playerProxy, signalId });
		}

		_removePlayer(name) {
			const player = this._players.get(name);
			if (!player) return;

			player.playerProxy.disconnect(player.signalId);
			this._players.delete(name);
		}

		_onPlayerChanged() {
			this._isPlaying = [...this._players.values()].some(
				({ playerProxy }) => playerProxy.PlaybackStatus === "Playing",
			);

			if (this._isPlaying === this._lastEmittedPlaying) return;

			this._lastEmittedPlaying = this._isPlaying;
			this.emit("is-playing", this._isPlaying);
		}

		_onOwnerChanged([name, oldOwner, newOwner]) {
			if (!name.startsWith("org.mpris.MediaPlayer2.")) return;

			if (newOwner === "") this._removePlayer(name);
			else if (oldOwner === "") this._addPlayer(name);

			this._onPlayerChanged();
		}

		_disconnect() {
			this._dbusProxy.disconnectSignal(this._dbusSignalId);

			for (const name of this._players.keys()) this._removePlayer(name);

			this._players.clear();
		}
	},
);
