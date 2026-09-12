// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

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
