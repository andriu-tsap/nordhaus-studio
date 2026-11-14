<?php
/**
 * Plugin Name: Nordhaus Studio
 * Description: Headless CMS i dane demonstracyjne fikcyjnej marki. CPT, pola REST, WooCommerce.
 * Version: 1.0.0
 * Author: Andrii Tsap
 */
if (!defined('ABSPATH')) { exit; }
add_action('init', function () {
    foreach (['realizacje' => 'Przestrzenie', 'faq' => 'FAQ', 'zespol' => 'Zespół'] as $slug => $label) {
        register_post_type('nh_' . $slug, ['label' => $label, 'public' => true, 'show_in_rest' => true, 'supports' => ['title', 'editor', 'thumbnail', 'custom-fields']]);
        register_post_meta('nh_' . $slug, 'nh_subtitle', ['type' => 'string', 'single' => true, 'show_in_rest' => true, 'sanitize_callback' => 'sanitize_text_field', 'auth_callback' => function () { return current_user_can('edit_posts'); }]);
    }
});
add_action('rest_api_init', function () {
    register_rest_route('nordhaus/v1', '/export', ['methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => function () {
        $products = [];
        if (function_exists('wc_get_products')) {
            foreach (wc_get_products(['limit' => 100, 'status' => 'publish', 'type' => ['simple', 'variable']]) as $p) {
                $attrs = $p->get_attributes(); $colors = []; $sizes = [];
                foreach ($attrs as $attr) {
                    if ($attr->get_name() === 'Kolor') { $colors = $attr->get_options(); }
                    if ($attr->get_name() === 'Rozmiar') { $sizes = $attr->get_options(); }
                }
                $products[] = ['id' => $p->get_slug(), 'name' => $p->get_name(), 'category' => $p->get_meta('nh_category') ?: 'Meble', 'price' => (int) round((float) $p->get_price() * 100), 'description' => wp_strip_all_tags($p->get_description()), 'image' => $p->get_meta('nh_image') ?: 'chair', 'colors' => $colors ?: ['Naturalny'], 'sizes' => $sizes ?: ['Standard']];
            }
        }
        $articles = [];
        foreach (get_posts(['post_type' => 'post', 'numberposts' => 100, 'post_status' => 'publish']) as $post) {
            if (get_post_meta($post->ID, 'nh_demo', true) !== 'yes') { continue; }
            $cats = wp_get_post_categories($post->ID, ['fields' => 'names']);
            $articles[] = ['slug' => $post->post_name, 'title' => get_the_title($post), 'category' => $cats[0] ?? 'Inspiracje', 'excerpt' => wp_strip_all_tags($post->post_excerpt), 'paragraphs' => array_values(array_filter(array_map('wp_strip_all_tags', explode("\n\n", $post->post_content))))];
        }
        return ['products' => $products, 'articles' => $articles];
    }]);
});
function nh_seed_demo() {
    if (!class_exists('WC_Product_Variable')) { return 'Najpierw aktywuj WooCommerce.'; }
    $rows = [
        ['fotel-ora','Fotel Ora','Meble',2490,'chair',['Piaskowy','Grafitowy'],['Standard']],
        ['stol-form','Stół Form','Meble',3890,'table',['Dąb naturalny','Dąb ciemny'],['160 cm','200 cm']],
        ['lampa-line','Lampa Line','Oświetlenie',890,'lamp',['Czarny','Kremowy'],['S','M']],
        ['sofa-havn','Sofa Havn','Meble',6490,'sofa',['Piaskowy','Grafitowy'],['2 miejsca','3 miejsca']],
        ['wazon-arc','Wazon Arc','Dodatki',290,'vase',['Kremowy','Terakota'],['S','L']],
        ['stolik-noma','Stolik Noma','Meble',1290,'table',['Dąb naturalny'],['60 cm','80 cm']],
    ];
    foreach ($rows as [$slug,$name,$category,$price,$image,$colors,$sizes]) {
        if (get_page_by_path($slug, OBJECT, 'product')) { continue; }
        $p = new WC_Product_Variable(); $p->set_name($name); $p->set_slug($slug); $p->set_status('publish'); $p->set_description('Produkt demonstracyjny Nordhaus. Naturalne materiały i ponadczasowa forma. Fikcyjna marka — bez sprzedaży.');
        $attrs = [];
        foreach (['Kolor' => $colors, 'Rozmiar' => $sizes] as $label => $options) {
            $a = new WC_Product_Attribute(); $a->set_name($label); $a->set_options($options); $a->set_visible(true); $a->set_variation(true); $attrs[] = $a;
        }
        $p->set_attributes($attrs); $p->update_meta_data('nh_category', $category); $p->update_meta_data('nh_image', $image); $id = $p->save();
        foreach ($colors as $color) { foreach ($sizes as $size) {
            $v = new WC_Product_Variation(); $v->set_parent_id($id); $v->set_attributes(['kolor' => $color, 'rozmiar' => $size]); $v->set_regular_price((string) $price); $v->set_status('publish'); $v->set_stock_status('instock'); $v->save();
        }}
        WC_Product_Variable::sync($id);
    }
    foreach (['nh_realizacje' => ['Spokojny dom','Ogród na co dzień'], 'nh_faq' => ['Jak działa demo?','Co obejmuje wycena?'], 'nh_zespol' => ['Julia — projektantka','Adam — doradca']] as $type => $titles) {
        foreach ($titles as $title) { if (!get_posts(['post_type' => $type, 'title' => $title])) { wp_insert_post(['post_type' => $type, 'post_status' => 'publish', 'post_title' => $title, 'post_content' => 'Przykładowa treść koncepcyjna. Osoby i marka są fikcyjne.', 'meta_input' => ['nh_subtitle' => 'Koncepcja Nordhaus']]); } }
    }
    foreach ([['taras-przez-caly-rok','Taras, który przedłuża dom'], ['jak-wybrac-zadaszenie','Lamele, szkło czy poliwęglan?'], ['naturalne-materialy','Mniej przedmiotów. Więcej jakości.']] as [$slug,$title]) {
        if (!get_page_by_path($slug, OBJECT, 'post')) {
            wp_insert_post(['post_type'=>'post','post_status'=>'publish','post_name'=>$slug,'post_title'=>$title,'post_excerpt'=>'Poradnik koncepcyjnej marki Nordhaus Studio.','post_content'=>"Zacznij od potrzeb swojej przestrzeni. Zwróć uwagę na światło, proporcje i trwałość materiałów.\n\nKażdy projekt wymaga indywidualnego pomiaru. Konfigurator pokazuje cenę orientacyjną, bez montażu i fundamentów.",'meta_input'=>['nh_demo'=>'yes']]);
        }
    }
    return 'Zaimportowano dane demonstracyjne.';
}
add_action('admin_menu', function () { add_management_page('Nordhaus demo', 'Nordhaus demo', 'manage_options', 'nh-demo', function () {
    echo '<div class="wrap"><h1>Nordhaus Studio — fikcyjna marka</h1>';
    if (isset($_POST['nh_seed'])) { check_admin_referer('nh_seed'); echo '<p>' . esc_html(nh_seed_demo()) . '</p>'; }
    echo '<form method="post">'; wp_nonce_field('nh_seed'); echo '<button class="button button-primary" name="nh_seed" value="1">Wczytaj dane demo</button></form></div>';
}); });
if (defined('WP_CLI') && WP_CLI) { WP_CLI::add_command('nordhaus seed', function () { WP_CLI::success(nh_seed_demo()); }); }
