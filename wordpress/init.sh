#!/bin/sh
set -eu
# Wait for the WordPress image to populate its shared volume.
i=0
until [ -f /var/www/html/wp-config.php ]; do i=$((i+1)); [ "$i" -lt 60 ] || exit 1; sleep 2; done
if ! wp core is-installed; then
 wp core install --url=http://localhost:8080 --title='Nordhaus Studio — fikcyjna marka' --admin_user="$WP_ADMIN_USER" --admin_password="$WP_ADMIN_PASSWORD" --admin_email="$WP_ADMIN_EMAIL" --skip-email
fi
wp rewrite structure '/%postname%/' --hard
if ! wp plugin is-installed woocommerce; then wp plugin install woocommerce --activate; else wp plugin activate woocommerce; fi
wp plugin activate nordhaus-studio
wp nordhaus seed
