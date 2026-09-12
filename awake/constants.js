// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

export const ENABLED_ICON = "camera-flash-symbolic";
export const DISABLED_ICON = "camera-flash-disabled-symbolic";
export const MENU_ICON = "alarm-symbolic";

export const TIMERS = [
	{ duration: 600, label: "10 minutes", icon: "skip-backwards-10-symbolic" },
	{ duration: 1800, label: "30 minutes", icon: "skip-backwards-30-symbolic" },
	{ duration: 0, label: "Always on", icon: "camera-flash-auto-symbolic" },
];

export const DBUS_INTERFACE = `<node>
	<interface name="org.freedesktop.DBus">
		<method name="ListNames">
			<arg type="as" direction="out"/>
		</method>
		<signal name="NameOwnerChanged">
			<arg type="s"/>
			<arg type="s"/>
			<arg type="s"/>
		</signal>
	</interface>
</node>`;

export const MPRIS_INTERFACE = `<node>
	<interface name="org.mpris.MediaPlayer2.Player">
		<property name="PlaybackStatus" type="s" access="read"/>
	</interface>
</node>`;

export const SESSION_MANAGER_INTERFACE = `<node>
	<interface name="org.gnome.SessionManager">
		<method name="Inhibit">
			<arg type="s" direction="in"/>
			<arg type="u" direction="in"/>
			<arg type="s" direction="in"/>
			<arg type="u" direction="in"/>
			<arg type="u" direction="out"/>
		</method>
		<method name="Uninhibit">
			<arg type="u" direction="in"/>
		</method>
	</interface>
</node>`;
