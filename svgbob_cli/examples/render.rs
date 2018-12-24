extern crate handlebars;
use std::fs::File;

use std::collections::BTreeMap;

use handlebars::Handlebars;
extern crate svg;
extern crate svgbob;

use handlebars::Context;

fn main() {
    let svg_file = "screenshots/image.svg";
    let html_file = "index.html";
    let bob_str = include_str!("long.bob");
    let svg = svgbob::to_svg(bob_str);
    svg::save(svg_file, &svg).unwrap();
    println!("Saved to {}", svg_file);

    let handlebars = Handlebars::new();
    let mut m: BTreeMap<String, String> = BTreeMap::new();
    m.insert("bob".to_string(), bob_str.to_owned());
    m.insert("svg_file".to_string(), svg_file.to_string());
    let context = Context::wraps(&m);

    let mut source_template = File::open(&"web/index.hbs").unwrap();
    let mut output_file = File::create(html_file).unwrap();
    if let Ok(_) = handlebars.template_renderw2(&mut source_template, &context, &mut output_file) {
        println!("Rendered to {}", html_file);
    } else {
        println!("Error");
    };
}
