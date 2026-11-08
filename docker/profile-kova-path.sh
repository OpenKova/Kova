# shellcheck shell=sh
# Installed as /etc/profile.d/kova.sh. Debian's /etc/profile resets PATH for
# every login shell (`bash -l`, `docker exec <c> bash -l`, ssh, the terminal
# tool's background `bash -lic`), dropping the image's ENV PATH dirs, so bare
# `kova` exits 127 there. Put them back in the ENV PATH order; dirs a login
# PATH already lists keep their position.
for __kova_p in /opt/data/.local/bin /opt/kova/.venv/bin /opt/kova/bin; do
    case ":$PATH:" in
        *":$__kova_p:"*) ;;
        *) PATH="$__kova_p:$PATH" ;;
    esac
done
unset __kova_p
export PATH
