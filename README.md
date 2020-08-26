# hostess

hosts file manipulation tool

# installation

```
> git clone https://github.com/CobaltXII/hostess.git
> npm install -g .
```

# usage

```
> hostess
hostess - hosts file manipulation tool

usage:
	hostess -a <alias> <ip> [<comment>]
		Append entry.
	hostess -ri <ip>
		Remove all entries with the specified ip.
	hostess -ra <alias>
		Remove all entries with the specified alias.
	hostess -e
		Enumerate all entries.

contact:
	http://cxii.org/

# adding an entry
> hostess -a mywebsite.com 127.0.0.1

# removing an entry by alias
# you usually want to do this
> hostess -ra mywebsite.com

# removing an entry by ip
# you usually don't want to do this
> hostess -ri 127.0.0.1

# listing all entries
> hostess -e
ipv4 entries
=======================================
localhost ->            127.0.0.1
broadcasthost ->        255.255.255.255
cxii.org ->             127.0.0.1
krunkercss.com ->       127.0.0.1

ipv6 entries
=======================================
localhost ->            ::1
```