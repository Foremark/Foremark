// Use `wee_alloc` as the global allocator to produce a small module.
use wee_alloc;
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

use wasm_bindgen::prelude::*;
use svgbob;

#[wasm_bindgen]
pub fn to_svg(s: &str) -> String {
    let mut settings = svgbob::Settings::default();
    settings.stroke_width = 1.0;

    let g = svgbob::Grid::from_str(&s, &settings);
    format!("{}", g.get_svg())
}
