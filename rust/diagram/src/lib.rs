// Use `wee_alloc` as the global allocator to produce a small module.
use wee_alloc;
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

use wasm_bindgen::prelude::*;
use svgbob;

#[wasm_bindgen]
pub fn to_svg(s: &str) -> String {
    let settings = svgbob::Settings::default();
    let g = svgbob::Grid::from_str(&s, &settings);
    format!("{}", g.get_svg())
}
