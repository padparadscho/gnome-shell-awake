# GNOME Shell Awake

GNOME Shell extension for preventing the device from going to sleep.

## Install

Download the latest archive from the
[releases page](https://github.com/padparadscho/gnome-shell-awake/releases).

```sh
unzip -q awake@padparadscho.com.zip -d ~/.local/share/gnome-shell/extensions/awake@padparadscho.com/
glib-compile-schemas ~/.local/share/gnome-shell/extensions/awake@padparadscho.com/schemas/
gnome-extensions enable awake@padparadscho.com
```

> [!NOTE]
> On Wayland, log out and log back in. On X11, press `Alt + F2`, type `r`, and press `Enter`.

## License

This project is licensed under the [AGPL-3.0](/LICENSE) license.
