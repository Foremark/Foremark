use wasm_bindgen::prelude::*;
use svgbob;

#[wasm_bindgen]
pub fn to_svg(s: &str) -> String {
    let settings = svgbob::Settings::default();
    let g = svgbob::Grid::from_str(&s, &settings);
    format!("{}", g.get_svg())
}
