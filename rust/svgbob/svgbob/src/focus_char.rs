use block::Block;
use fragments::Fragment;
use loc::Loc;
use grid::Grid;
use properties::{
    Properties,
    Signal::{self,Weak,Medium,Strong},
    Can::{self,ConnectTo,Is,IsStrongAll},
    Characteristic,
};
use point_block::PointBlock;
use point::Point;
use loc_block::LocBlock;
use element::Element;
use fragments::Fragment::Text;
use element::{line,dashed_line,circle_start_line,
    square_start_line, circle_open_line,big_circle_open_line, 
    arrow_line,clear_arrow_line, start_arrow_line,arc,open_circle,text};
use location::Location;
use settings::Settings;
use enhance::Enhance;
use enhance_circle::EnhanceCircle;

#[derive(Debug, Clone)]
pub struct FocusChar<'g> {
    pub loc: Loc,
    ch: char,
    grid: &'g Grid,
}

impl<'g> FocusChar<'g> {
    pub fn new(loc: &Loc, grid: &'g Grid) -> Self {
        //  make a new focus char from the grid at this location
        let s: Option<&String> = grid.get(loc);
        // if there is a text in this location, take the first char as the focus char
        let ch = match s {
            Some(s) => s.chars().nth(0).unwrap_or('\0'),
            None => '\0',
        };

        Self {
            loc: loc.clone(),
            ch: ch,
            grid: grid,
        }
    }


    /// get the text of self char, including complex block
    /// concatenated with multiple strings in utf8 encoding
    fn text(&self) -> String {
        match self.grid.get(&self.loc) {
            Some(s) => s.to_owned(),
            None => "".to_string(),
        }
    }

    /// get the focus char at this location
    fn get(&self, loc: &Loc) -> Self {
        FocusChar::new(loc, self.grid)
    }

    /// if the character matches given argument
    pub fn is(&self, arg: char) -> bool {
        self.ch.is(arg)
    }

    /// if character is any character in the string
    pub fn any(&self, s: &str) -> bool {
        self.ch.any(s)
    }

    /// if it's properties is static such as unicode box drawing
    /// they are automatically used as drawing element
    /// otherwise, check if the the surrounding character can connect to this character
    fn used_as_drawing(&self)-> bool {
        // all box uncide drawing are static
        if self.ch.is_static() {
            true
        }
        else{
            //  --
            (self.can_strongly_connect(&Block::O) && self.right().can_pass_medium_connect(&Block::K))
            || (self.can_strongly_connect(&Block::K) && self.left().can_pass_medium_connect(&Block::O))
            //   |
            //   |
            || (self.can_strongly_connect(&Block::C) && self.top().can_pass_medium_connect(&Block::W))
            || (self.can_strongly_connect(&Block::W) && self.bottom().can_pass_medium_connect(&Block::C))
            //   \
            //    \
            || (self.can_strongly_connect(&Block::A) && self.top_left().can_pass_medium_connect(&Block::Y))
            || (self.can_strongly_connect(&Block::Y) && self.bottom_right().can_pass_medium_connect(&Block::A))
            //    /
            //   /
            || (self.can_strongly_connect(&Block::E) && self.top_right().can_pass_medium_connect(&Block::U))
            || (self.can_strongly_connect(&Block::U) && self.bottom_left().can_pass_medium_connect(&Block::E))
            //  __
            || (self.can_strongly_connect(&Block::U) && self.left().can_pass_medium_connect(&Block::Y))
            || (self.can_strongly_connect(&Block::Y) && self.right().can_pass_medium_connect(&Block::U))
        }
    }

    /// determine if the character at this location
    /// is used as text or not
    fn used_as_text(&self) -> bool {
        if self.used_as_drawing(){
            false
        }
        else{
            self.is_text_surrounded()
        }
    }

    fn is_text_char(&self)->bool{
        if self.ch.any("oO_"){// exclude letter oO and _underscore in the alphanumeric 
            return false;
        }
        else {
            self.ch.is_alphanumeric()
        }
    }


    fn is_text_surrounded(&self) -> bool {
        self.left().is_text_char() || self.right().is_text_char()
    }

    pub fn is_null(&self) -> bool {
        self.is('\0')
    }

    pub fn is_blank(&self) -> bool {
        self.is_null() || self.is(' ')
    }

    ///////////////////////////////////
    //
    //  can strongly or mediumly connect
    //
    ///////////////////////////////////

    fn can_pass_medium_connect(&self, block: &Block) -> bool {
        self.can_strongly_connect(block) || self.can_medium_connect(block)
    }

    fn can_pass_weakly_connect(&self, block: &Block) -> bool {
        self.can_strongly_connect(block) || self.can_medium_connect(block)
            || self.can_weakly_connect(block)
    }

    pub fn can_strongly_connect(&self, block: &Block) -> bool {
        self.ch.can_connect(&Strong, block)
    }

    fn can_medium_connect(&self, block: &Block) -> bool {
        self.ch.can_connect(&Medium, block)
    }

    fn can_weakly_connect(&self, block: &Block) -> bool {
        self.ch.can_connect(&Weak, block)
    }

    fn point(&self, pb: &PointBlock) -> Point {
        self.loc_block().to_point(pb)
    }

    fn loc_block(&self) -> LocBlock {
        LocBlock {
            loc: self.loc.to_owned(),
            settings: self.get_settings(),
        }
    }

    fn to_element(&self, frag: Fragment) -> Element {
        let unit_x = self.loc_block().unit_x();
        match frag {
            Fragment::Line(p1, p2) => line(&self.point(&p1), &self.point(&p2)),
            Fragment::CircleStartLine(p1, p2) => circle_start_line(&self.point(&p1), &self.point(&p2)),
            Fragment::SquareStartLine(p1, p2) => square_start_line(&self.point(&p1), &self.point(&p2)),
            Fragment::CircleOpenLine(p1, p2) => circle_open_line(&self.point(&p1), &self.point(&p2)),
            Fragment::BigCircleOpenLine(p1, p2) => big_circle_open_line(&self.point(&p1), &self.point(&p2)),
            Fragment::DashedLine(p1, p2) => dashed_line(&self.point(&p1), &self.point(&p2)),
            Fragment::ArrowLine(p1, p2) => arrow_line(&self.point(&p1), &self.point(&p2)),
            Fragment::ClearArrowLine(p1, p2) => clear_arrow_line(&self.point(&p1), &self.point(&p2)),
            Fragment::StartArrowLine(p1, p2) => start_arrow_line(&self.point(&p1), &self.point(&p2)),
            Fragment::Arc(p1, p2, m) => arc(&self.point(&p1), &self.point(&p2), m as f32 * unit_x),
            Fragment::OpenCircle(c, m) => open_circle(&self.point(&c), m as f32 * unit_x),
            Fragment::Text(s) => text(&self.loc, &s),
        }
    }

    /// TODO: optimize this by getting accumulating the location
    /// and convert it into loc in 1 call
    /// then get the focus char at this location;
    fn from_location(&self, location: &Location) -> FocusChar<'g> {
        let loc = self.loc.from_location(location);
        self.get(&loc)
    }

    fn can_block_pass_connect(&self, block: &Block, signal: &Signal) -> bool {
        match *signal {
            Strong => self.can_strongly_connect(block),
            Medium => self.can_pass_medium_connect(block),
            Weak => self.can_pass_weakly_connect(block),
        }
    }

    /// return the ehance circle elements and the consumed locations
    pub fn get_enhance_circle_elements(&self) -> (Vec<Element>, Vec<Loc>) {
        let (fragments, consumed_location) = self.get_enhance_circle_fragments();
        let elements: Vec<Element> = fragments
            .into_iter()
            .map(|frag| self.to_element(frag))
            .collect();
        let consumed_loc: Vec<Loc> = consumed_location
            .into_iter()
            .map(|location| self.loc.from_location(&location))
            .collect();
        (elements, consumed_loc)
    }

    /// return the ehance elements and the consumed locations
    pub fn get_enhance_elements(&self) -> (Vec<Element>, Vec<Loc>) {
        let (fragments, consumed_location) = self.get_enhance_fragments();
        let elements: Vec<Element> = fragments
            .into_iter()
            .map(|frag| self.to_element(frag))
            .collect();
        let consumed_loc: Vec<Loc> = consumed_location
            .into_iter()
            .map(|location| self.loc.from_location(&location))
            .collect();
        (elements, consumed_loc)
    }

    /// returns the defaults elements
    pub fn get_elements(&self) -> Vec<Element> {
        let fragments = self.get_fragments();
        let elements: Vec<Element> = fragments
            .into_iter()
            .map(|frag| self.to_element(frag))
            .collect();
        (elements)
    }

    fn is_satisfied(&self, can: &Can) -> bool {
        match *can {
            ConnectTo(ref cond_block, ref signal) => {
                self.can_block_pass_connect(&cond_block, signal)
            }
            Is(char) => self.is(char),
            IsStrongAll(ref blocks) => blocks.iter().all(|b| self.is_strong_block(&b)),
        }
    }

    /// check to see if this specified block for this focused
    /// char is intensified to be strong
    fn is_intensified(&self, arg_block: &Block) -> bool {
        let character: Option<Characteristic> = self.ch.get_characteristic();
        if let Some(character) = character {
            character.intensify.iter().any(|&(ref block, ref cond)| {
                let fc = self.from_location(&cond.loc);
                block == arg_block && fc.is_satisfied(&cond.can)
            })
        } else {
            false
        }
    }

    /// check if this block can be a strong block
    /// when applying the intesifier
    fn can_be_strong_block(&self, block: &Block) -> bool {
        if self.is_strong_block(block) {
            true
        } else if self.is_intensified(block) {
            true
        } else {
            false
        }
    }

    /// check if each blocks in the vectors can be strong when
    /// applying the intesifiers
    pub fn can_be_strong_all_blocks(&self, blocks: Vec<Block>) -> bool{
        blocks.iter().all(|b| self.can_be_strong_block(b))
    }

    fn is_strong_block(&self, block: &Block) -> bool {
        let character: Option<Characteristic> = self.ch.get_characteristic();
        if let Some(character) = character {
            if character.is_strong_block(block) {
                return true;
            }
        }
        false
    }

    fn get_enhance_fragments(&self) -> (Vec<Fragment>, Vec<Location>) {
        let mut elm: Vec<Fragment> = vec![];
        let mut consumed: Vec<Location> = vec![];
        let (enhanced, enhance_consumed) = self.enhance();
        elm.extend(enhanced);
        consumed.extend(enhance_consumed);
        elm.sort();
        elm.dedup();
        consumed.sort();
        consumed.dedup();
        (elm, consumed)
    }

    fn get_enhance_circle_fragments(&self) -> (Vec<Fragment>, Vec<Location>) {
        let mut elm: Vec<Fragment> = vec![];
        let mut consumed: Vec<Location> = vec![];
        let (enhanced, enhance_consumed) = self.enhance_circle();
        elm.extend(enhanced);
        consumed.extend(enhance_consumed);
        elm.sort();
        elm.dedup();
        consumed.sort();
        consumed.dedup();
        (elm, consumed)
    }


    /// get the fragements generated at this focus character and the
    /// consumed locations
    fn get_fragments(&self) -> Vec<Fragment>{
        let character: Option<Characteristic> = self.ch.get_characteristic();
        let mut elm: Vec<Fragment> = vec![];

        let mut matched_intended = false;


        if let Some(character) = character {
            for &(ref blocks, ref fragments) in &character.intended_behavior {
                let meet = blocks.iter().all(|ref b| self.can_be_strong_block(&b));
                if meet && !self.used_as_text() {
                    elm.extend(fragments.clone());
                    matched_intended = true;
                }
            }

            // default behaviors
            // add only when signal is strong
            // or the signal has been intensified to strong
            let mut matched = false;
            if !matched_intended {
                for &(ref block, ref _signal, ref fragments) in &character.properties {
                    // draw when a strong block and not used as text
                    if self.is_strong_block(&block) && !self.used_as_text() {
                        elm.extend(fragments.clone());
                        matched = true;
                    }
                    // intensified the block
                    else if self.is_intensified(&block) && !self.used_as_text() {
                        elm.extend(fragments.clone());
                        matched = true;
                    }
                }
            }
            if !matched && !matched_intended && !self.is_blank() {
                elm.push(Text(self.text()));
            }
        } else {
            if !self.is_blank() {
                // This is to disconnect words
                elm.push(Text(self.text()));
            }
        }
        elm.sort();
        elm.dedup();
        elm
    }

    fn get_settings(&self) -> Settings {
        self.grid.settings.clone()
    }

    pub fn top(&self) -> Self {
        self.get(&self.loc.top())
    }

    pub fn bottom(&self) -> Self {
        self.get(&self.loc.bottom())
    }

    pub fn left(&self) -> Self {
        self.get(&self.loc.left())
    }

    pub fn in_left(&self, n: i32) -> Self {
        self.get(&self.loc.in_left(n))
    }
    pub fn in_right(&self, n: i32) -> Self {
        self.get(&self.loc.in_right(n))
    }

    pub fn in_top(&self, n: i32) -> Self {
        self.get(&self.loc.in_top(n))
    }
    pub fn in_bottom(&self, n: i32) -> Self {
        self.get(&self.loc.in_bottom(n))
    }

    pub fn right(&self) -> Self {
        self.get(&self.loc.right())
    }

    pub fn top_left(&self) -> Self {
        self.get(&self.loc.top_left())
    }

    pub fn top_right(&self) -> Self {
        self.get(&self.loc.top_right())
    }

    pub fn bottom_left(&self) -> Self {
        self.get(&self.loc.bottom_left())
    }

    pub fn bottom_right(&self) -> Self {
        self.get(&self.loc.bottom_right())
    }
}
