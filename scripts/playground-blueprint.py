from pathlib import Path
import json
plugin = Path('wordpress/nordhaus-studio/nordhaus-studio.php').read_text()
blueprint = {'$schema':'https://playground.wordpress.net/blueprint-schema.json','landingPage':'/wp-admin/','preferredVersions':{'php':'8.3','wp':'latest'},'features':{'networking':True},'steps':[{'step':'login'},{'step':'installPlugin','pluginData':{'resource':'wordpress.org/plugins','slug':'woocommerce'},'options':{'activate':True}},{'step':'mkdir','path':'/wordpress/wp-content/plugins/nordhaus-studio'},{'step':'writeFile','path':'/wordpress/wp-content/plugins/nordhaus-studio/nordhaus-studio.php','data':plugin},{'step':'activatePlugin','pluginPath':'nordhaus-studio/nordhaus-studio.php'},{'step':'runPHP','code':"<?php require_once '/wordpress/wp-load.php'; echo nh_seed_demo();"}]}
Path('wordpress/blueprint.json').write_text(json.dumps(blueprint,ensure_ascii=False,indent=2)+'\n')
